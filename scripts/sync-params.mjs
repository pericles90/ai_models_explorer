#!/usr/bin/env node
/**
 * Sincroniza as explicações dos parâmetros da API a partir da spec OpenAPI
 * oficial da OpenRouter, fundida com a camada curada em português.
 *
 * Fontes (nesta ordem de precedência):
 *   1. params.pt-BR.json   -> descrição curada em pt-BR (HTML confiável, do repo)
 *   2. openapi.json        -> descrição, tipo, enum, exemplo e default oficiais
 * Tipo/enum/nullable SEMPRE vêm da spec; o overlay só sobrepõe texto e exemplos.
 *
 * Gera DOIS artefatos:
 *   a) params.json  -> buscado em runtime pela página. Como fica na mesma origem
 *      (ex.: pericles90.github.io), não esbarra em CORS. Atualizar as descrições
 *      passa a ser trocar esse arquivo, sem tocar no index.html.
 *   b) bloco `// <auto:params>` embutido no index.html -> fallback usado quando
 *      o fetch falha: abertura via file://, WebView Android e modo offline.
 *
 * Por que a spec não é buscada direto do navegador: https://openrouter.ai/openapi.json
 * NÃO envia cabeçalho CORS (diferente de /api/v1/models, que envia
 * `Access-Control-Allow-Origin: *`). Por isso ela é consumida aqui, no build.
 *
 * Uso:
 *   node scripts/sync-params.mjs           # atualiza index.html + params.json
 *   node scripts/sync-params.mjs --check   # falha se estiver desatualizado (CI)
 *   node scripts/sync-params.mjs --dry-run # só mostra o resultado
 *
 * Requer Node 18+ (fetch nativo). Sem dependências.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SPEC_URL = 'https://openrouter.ai/openapi.json';
const MODELS_URL = 'https://openrouter.ai/api/v1/models';
const SCHEMA_NAME = 'ChatRequest';

const START = '// <auto:params>';
const END = '// </auto:params>';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVO_HTML = join(raiz, 'index.html');
const ARQUIVO_OVERLAY = join(raiz, 'params.pt-BR.json');
const ARQUIVO_SAIDA = join(raiz, 'params.json');

const args = new Set(process.argv.slice(2));
const modoCheck = args.has('--check');
const modoDryRun = args.has('--dry-run');

/* ------------------------------------------------------------------ */
/* Resolução de $ref                                                   */
/* ------------------------------------------------------------------ */

function resolverRef(ref, spec) {
    // "#/components/schemas/ChatToolChoice" -> objeto correspondente
    const partes = ref.replace(/^#\//, '').split('/');
    let atual = spec;
    for (const parte of partes) {
        if (!atual) return null;
        atual = atual[parte];
    }
    return atual || null;
}

// Segue $ref até o schema concreto, com guarda contra ciclos
function desreferenciar(schema, spec, vistos = new Set()) {
    let atual = schema;
    while (atual && atual.$ref) {
        if (vistos.has(atual.$ref)) return null;
        vistos.add(atual.$ref);
        atual = resolverRef(atual.$ref, spec);
    }
    return atual;
}

/* ------------------------------------------------------------------ */
/* Extração de tipo legível                                            */
/* ------------------------------------------------------------------ */

const PRIMITIVOS = new Set(['string', 'number', 'integer', 'boolean', 'enum']);

// O tipo vira um chip curto na interface, então schemas compostos colapsam para
// "object"/"array" em vez de virar uma união gigante de nomes internos da spec.
function formatarTipo(schema, spec, profundidade = 0) {
    if (!schema || profundidade > 3) return 'varies';

    if (schema.$ref) {
        const alvo = desreferenciar(schema, spec);
        if (!alvo) return 'object';
        if (alvo.enum) return 'enum';
        if (typeof alvo.type === 'string' && alvo.type !== 'object') {
            return formatarTipo(alvo, spec, profundidade + 1);
        }
        if (alvo.anyOf || alvo.oneOf) return formatarTipo(alvo, spec, profundidade + 1);
        return 'object';
    }

    const variantes = schema.anyOf || schema.oneOf;
    if (Array.isArray(variantes)) {
        const tipos = [...new Set(
            variantes
                .map(v => formatarTipo(v, spec, profundidade + 1))
                .filter(t => t && t !== 'null' && t !== 'varies')
        )];
        if (!tipos.length) return 'varies';
        // União só é legível se for curta e de primitivos
        if (tipos.length <= 2 && tipos.every(t => PRIMITIVOS.has(t) || t.startsWith('array'))) {
            return tipos.join(' | ');
        }
        return tipos.every(t => t.startsWith('array')) ? 'array' : 'object';
    }

    if (Array.isArray(schema.type)) {
        const tipos = schema.type.filter(t => t !== 'null');
        if (!tipos.length) return 'varies';
        return tipos.length <= 2 ? tipos.join(' | ') : 'varies';
    }

    if (schema.type === 'array') {
        const item = schema.items ? formatarTipo(schema.items, spec, profundidade + 1) : '';
        return PRIMITIVOS.has(item) ? `array<${item}>` : 'array';
    }

    if (schema.enum) return 'enum';

    return schema.type || 'varies';
}

/* ------------------------------------------------------------------ */
/* Extração dos metadados de um parâmetro                              */
/* ------------------------------------------------------------------ */

function extrairParametro(nome, schema, spec) {
    const alvo = schema.$ref ? desreferenciar(schema, spec) : schema;

    // description pode estar na própria propriedade ou no schema referenciado
    const descricao = schema.description || (alvo && alvo.description) || null;
    const exemplo = schema.example !== undefined
        ? schema.example
        : (alvo && alvo.example !== undefined ? alvo.example : undefined);
    const padrao = schema.default !== undefined
        ? schema.default
        : (alvo && alvo.default !== undefined ? alvo.default : undefined);

    // enum pode vir da propriedade, do ref, ou das variantes anyOf/oneOf
    let valores = schema.enum || (alvo && alvo.enum) || null;
    if (!valores) {
        const variantes = (alvo && (alvo.anyOf || alvo.oneOf)) || schema.anyOf || schema.oneOf;
        if (Array.isArray(variantes)) {
            const coletados = variantes.flatMap(v => v.enum || []);
            if (coletados.length) valores = coletados;
        }
    }

    const aceitaNull = Array.isArray(schema.type)
        ? schema.type.includes('null')
        : Boolean((schema.anyOf || schema.oneOf || []).some(v => v.type === 'null'));

    return {
        type: formatarTipo(schema, spec),
        description: descricao,
        example: exemplo !== undefined ? JSON.stringify(exemplo) : null,
        default: padrao !== undefined ? JSON.stringify(padrao) : null,
        enum: valores && valores.length ? valores.filter(v => v !== null) : null,
        nullable: aceitaNull || null
    };
}

/* ------------------------------------------------------------------ */
/* Geração do bloco                                                    */
/* ------------------------------------------------------------------ */

// As duas fontes guardam o exemplo em formatos diferentes: a spec traz só o
// VALOR (0.7), enquanto a camada curada costuma trazer o par completo
// ("temperature": 0.7). Normaliza tudo para o par completo, para quem consome
// o params.json poder exibir o campo direto, sem concatenar nada.
function normalizarExemplo(nome, exemplo, outraChaveEsperada = false) {
    if (exemplo === null || exemplo === undefined) return null;

    const texto = String(exemplo).trim();
    if (!texto) return null;

    const chave = JSON.stringify(nome);
    if (texto.startsWith(`${chave}:`) || texto.startsWith(`${chave} :`)) {
        return texto; // já vem no formato "nome": valor
    }

    // Exemplo apontando para outra chave costuma ser engano — mas há casos
    // legítimos (ex.: structured_outputs, que na prática se usa via
    // response_format). Esses são marcados com exampleUsesOtherKey na
    // camada curada e não geram aviso.
    const outraChave = texto.match(/^"([^"]+)"\s*:/);
    if (outraChave) {
        if (!outraChaveEsperada) {
            console.warn(`  ⚠️  exemplo de "${nome}" começa com a chave "${outraChave[1]}" — se for intencional, marque "exampleUsesOtherKey": true em params.pt-BR.json`);
        }
        return texto;
    }

    return `${chave}: ${texto}`;
}

// Funde a camada curada por cima do que veio da spec.
// Tipo, enum e nullable nunca são sobrepostos: são fatos da API, não redação.
function fundir(daSpec, overlay) {
    const resultado = {};
    const nomes = new Set([...Object.keys(daSpec), ...Object.keys(overlay)]);

    for (const nome of [...nomes].sort((a, b) => a.localeCompare(b))) {
        const spec = daSpec[nome] || {
            type: 'varies', description: null, example: null,
            default: null, enum: null, nullable: null
        };
        const curado = overlay[nome];

        resultado[nome] = {
            type: spec.type,
            enum: spec.enum,
            nullable: spec.nullable,
            // Texto: prioriza o curado (HTML), cai para o da spec (texto puro)
            description: curado?.description || spec.description || null,
            html: Boolean(curado?.description) || undefined,
            source: curado?.description ? 'pt-BR' : (spec.description ? 'spec' : null),
            // Guarda o texto oficial mesmo quando há tradução curada, para referência
            descriptionSpec: curado?.description && spec.description ? spec.description : undefined,
            example: normalizarExemplo(
                nome,
                curado?.example || spec.example,
                Boolean(curado?.exampleUsesOtherKey)
            ),
            default: curado?.default || spec.default || null,
            // Marca o que a spec sequer conhece, para o app avisar
            naSpec: Boolean(daSpec[nome]) || undefined
        };
    }
    return resultado;
}

function gerarBloco(parametros, meta) {
    const linhas = Object.entries(parametros).map(([nome, info]) => {
        const campos = [];
        for (const [chave, valor] of Object.entries(info)) {
            if (valor === undefined || valor === null) continue;
            campos.push(`${chave}: ${JSON.stringify(valor)}`);
        }
        return `            ${JSON.stringify(nome)}: { ${campos.join(', ')} }`;
    });

    // A indentação embutida aqui casa com a do <script> em index.html
    return [
        `        ${START}`,
        `        // Bloco GERADO por scripts/sync-params.mjs — não edite à mão.`,
        `        // Este é o FALLBACK embutido, usado quando o fetch de params.json falha`,
        `        // (abertura via file://, WebView Android, offline). No site publicado,`,
        `        // params.json é buscado em runtime e substitui este bloco.`,
        `        // Fontes: ${meta.fonte} + params.pt-BR.json`,
        `        // Gerado em: ${meta.geradoEm}`,
        `        // ${meta.total} parâmetros — ${meta.curados} curados em pt-BR, ${meta.daSpec} direto da spec, ${meta.semTexto} sem texto`,
        `        let PARAM_DOCS_META = ${JSON.stringify(meta)};`,
        ``,
        `        let paramDescriptions = {`,
        linhas.join(',\n'),
        `        };`,
        `        ${END}`
    ].join('\n');
}

/* ------------------------------------------------------------------ */
/* Principal                                                           */
/* ------------------------------------------------------------------ */

async function buscarJson(url, rotulo) {
    const resposta = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resposta.ok) {
        throw new Error(`Falha ao buscar ${rotulo} (${url}): HTTP ${resposta.status}`);
    }
    return resposta.json();
}

async function main() {
    console.log(`→ Baixando spec OpenAPI: ${SPEC_URL}`);
    const spec = await buscarJson(SPEC_URL, 'spec OpenAPI');

    const schema = spec?.components?.schemas?.[SCHEMA_NAME];
    if (!schema?.properties) {
        throw new Error(`Schema components.schemas.${SCHEMA_NAME}.properties não encontrado na spec.`);
    }

    console.log(`→ Baixando lista de modelos: ${MODELS_URL}`);
    const modelos = await buscarJson(MODELS_URL, 'lista de modelos');

    // Parâmetros que os modelos realmente anunciam suportar
    const usados = new Set();
    for (const modelo of modelos.data || []) {
        for (const p of modelo.supported_parameters || []) usados.add(p);
    }

    const props = schema.properties;
    const daSpec = {};

    // 1) Tudo que a spec descreve
    for (const [nome, propriedade] of Object.entries(props)) {
        daSpec[nome] = extrairParametro(nome, propriedade, spec);
    }

    // 2) Parâmetros que os modelos anunciam mas a spec não descreve
    const ausentes = [...usados].filter(p => !props[p]).sort();

    // 3) Camada curada em português
    console.log(`→ Lendo camada curada: params.pt-BR.json`);
    let overlay = {};
    try {
        const cru = JSON.parse(await readFile(ARQUIVO_OVERLAY, 'utf8'));
        overlay = cru.params || {};
    } catch (erro) {
        console.warn(`  ⚠️  params.pt-BR.json não pôde ser lido (${erro.code || erro.message}); seguindo só com a spec.`);
    }

    const parametros = fundir(daSpec, overlay);

    const total = Object.keys(parametros).length;
    const curados = Object.values(parametros).filter(p => p.source === 'pt-BR').length;
    const daSpecCount = Object.values(parametros).filter(p => p.source === 'spec').length;
    const semTexto = Object.entries(parametros).filter(([, p]) => !p.description);

    const meta = {
        fonte: SPEC_URL,
        geradoEm: new Date().toISOString().slice(0, 10),
        total,
        curados,
        daSpec: daSpecCount,
        semTexto: semTexto.length
    };

    const bloco = gerarBloco(parametros, meta);
    const json = JSON.stringify({ meta, params: parametros }, null, 2);

    console.log(`→ ${total} parâmetros: ${curados} curados em pt-BR, ${daSpecCount} direto da spec, ${semTexto.length} sem texto`);
    if (ausentes.length) {
        console.log(`  · anunciados por modelos mas ausentes da spec: ${ausentes.join(', ')}`);
    }
    if (semTexto.length) {
        console.log(`  ⚠️  sem texto explicativo: ${semTexto.map(([n]) => n).join(', ')}`);
    }

    if (modoDryRun) {
        console.log('\n--- bloco gerado (dry-run) ---\n');
        console.log(bloco);
        return;
    }

    const html = await readFile(ARQUIVO_HTML, 'utf8');
    const inicio = html.indexOf(START);
    const fim = html.indexOf(END);
    if (inicio === -1 || fim === -1) {
        throw new Error(`Marcadores ${START} / ${END} não encontrados em index.html.`);
    }
    // Recua até o começo da linha para o bloco substituir a indentação antiga também
    const inicioLinha = html.lastIndexOf('\n', inicio) + 1;

    // index.html usa CRLF; o bloco é montado com \n e convertido na hora de gravar
    const usaCRLF = html.includes('\r\n');
    const blocoNormalizado = usaCRLF ? bloco.replace(/\n/g, '\r\n') : bloco;

    const novo = html.slice(0, inicioLinha) + blocoNormalizado + html.slice(fim + END.length);

    let jsonAtual = null;
    try { jsonAtual = await readFile(ARQUIVO_SAIDA, 'utf8'); } catch { /* ainda não existe */ }

    // A data de geração muda todo dia; compara ignorando-a para não gerar ruído.
    // O arquivo é gravado com \n final, então a comparação precisa incluí-lo —
    // sem isso o --check acusaria params.json desatualizado em toda execução.
    // A normalização de \r\n protege contra checkout com CRLF (core.autocrlf),
    // que senão faria o --check falhar só por diferença de quebra de linha.
    const semData = texto => texto
        .replace(/"geradoEm":\s*"\d{4}-\d{2}-\d{2}"/g, '')
        .replace(/\r\n/g, '\n');
    const jsonComQuebra = json + '\n';
    const htmlIgual = semData(novo) === semData(html);
    const jsonIgual = jsonAtual !== null && semData(jsonComQuebra) === semData(jsonAtual);

    if (htmlIgual && jsonIgual) {
        console.log('✓ Já está atualizado (index.html e params.json).');
        return;
    }

    if (modoCheck) {
        const desatualizados = [!htmlIgual && 'index.html', !jsonIgual && 'params.json'].filter(Boolean);
        console.error(`✗ DESATUALIZADO: ${desatualizados.join(', ')}. Rode: node scripts/sync-params.mjs`);
        process.exit(1);
    }

    await writeFile(ARQUIVO_HTML, novo, 'utf8');
    await writeFile(ARQUIVO_SAIDA, jsonComQuebra, 'utf8');
    console.log('✓ index.html atualizado (fallback embutido).');
    console.log('✓ params.json gerado (consumido em runtime pelo site).');
}

main().catch(erro => {
    console.error(`✗ ${erro.message}`);
    process.exit(1);
});
