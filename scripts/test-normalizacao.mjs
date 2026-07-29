#!/usr/bin/env node
/**
 * Valida a normalização do catálogo da LiteLLM contra o arquivo real.
 *
 * O código testado NÃO é uma cópia: o bloco entre os marcadores
 * `// <normalizacao:inicio>` e `// <normalizacao:fim>` é recortado do
 * index.html e avaliado aqui. É por isso que aquele bloco é puro (nada de DOM
 * nem de estado global) — se alguém quebrar essa regra, este teste falha na
 * hora, em vez de o app quebrar só no navegador.
 *
 * Uso:
 *   node scripts/test-normalizacao.mjs            # baixa o JSON da LiteLLM
 *   node scripts/test-normalizacao.mjs arquivo.json  # usa um arquivo local
 *
 * Requer Node 18+ (fetch nativo). Sem dependências.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVO_HTML = join(raiz, 'index.html');

const INICIO = '// <normalizacao:inicio>';
const FIM = '// <normalizacao:fim>';

let falhas = 0;
let checagens = 0;

function ok(condicao, descricao, detalhe = '') {
    checagens++;
    if (condicao) {
        console.log(`  ✓ ${descricao}`);
        return true;
    }
    falhas++;
    console.error(`  ✗ ${descricao}${detalhe ? ` — ${detalhe}` : ''}`);
    return false;
}

function igual(recebido, esperado, descricao) {
    return ok(
        Object.is(recebido, esperado),
        descricao,
        `esperado ${JSON.stringify(esperado)}, recebido ${JSON.stringify(recebido)}`
    );
}

/* ------------------------------------------------------------------ */
/* Carrega o código de normalização direto do index.html               */
/* ------------------------------------------------------------------ */

async function carregarNormalizacao() {
    const html = await readFile(ARQUIVO_HTML, 'utf8');
    const inicio = html.indexOf(INICIO);
    const fim = html.indexOf(FIM);
    if (inicio === -1 || fim === -1) {
        throw new Error(`Marcadores ${INICIO} / ${FIM} não encontrados em index.html.`);
    }

    const bloco = html.slice(inicio + INICIO.length, fim);

    // As declarações são const/function no escopo do <script>; o módulo abaixo
    // as reexporta para o teste conseguir chamá-las.
    const fonte = `${bloco}\nexport { normalizarModelos, normalizarModelo, descreverModo, descreverPreco, CHAVES_NAO_MODELO, PRICING_FIELDS, UNIDADES_PRECO, CAPACIDADES };`;
    const url = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(fonte);
    return import(url);
}

async function carregarCatalogo(caminho) {
    if (caminho) {
        console.log(`→ Lendo catálogo local: ${caminho}`);
        return JSON.parse(await readFile(caminho, 'utf8'));
    }
    const url = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';
    console.log(`→ Baixando catálogo: ${url}`);
    const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao baixar o catálogo.`);
    return resposta.json();
}

/* ------------------------------------------------------------------ */
/* Casos                                                               */
/* ------------------------------------------------------------------ */

// A LiteLLM renomeia e move chaves entre releases. Fixar o id exato deixaria o
// teste vermelho por motivo errado, então cada caso aceita um plano B.
function acharModelo(modelos, exato, padrao) {
    const direto = modelos.find(m => m.id === exato);
    if (direto) return { modelo: direto, viaFallback: false };
    const alternativo = modelos.find(m => padrao.test(m.id));
    return { modelo: alternativo || null, viaFallback: true };
}

function testarChat(modelos, cru) {
    console.log('\n▸ gpt-4o (chat)');
    const { modelo } = acharModelo(modelos, 'gpt-4o', /^gpt-4o$/);
    if (!ok(Boolean(modelo), 'gpt-4o está no catálogo normalizado')) return;

    const bruto = cru['gpt-4o'];
    igual(modelo.provider, 'openai', 'provider vem de litellm_provider');
    igual(modelo.mode, 'chat', 'mode preservado');
    igual(modelo.context_length, bruto.max_input_tokens, 'context_length usa max_input_tokens');
    igual(modelo.max_output_tokens, bruto.max_output_tokens, 'max_output_tokens usa o campo dedicado');
    igual(modelo.pricing.input_cost_per_token, bruto.input_cost_per_token, 'preço de entrada é o número cru da LiteLLM');
    igual(modelo.pricing.output_cost_per_token, bruto.output_cost_per_token, 'preço de saída é o número cru da LiteLLM');
    ok(typeof modelo.pricing.input_cost_per_token === 'number', 'preço é número, não string');
    ok(modelo.architecture.input_modalities.includes('image'), 'supports_vision vira modalidade de entrada "image"');
    ok(modelo.capacidades.includes('tools'), 'function calling vira capacidade "tools"');
    ok(modelo.supported_parameters.includes('temperature'), 'parâmetro base de chat presente');
    ok(modelo.supported_parameters.includes('tools'), 'parâmetro derivado da flag presente');
}

function testarClaude(modelos) {
    console.log('\n▸ claude-3-5-haiku-20241022');
    // O id sem prefixo não existe mais no arquivo: hoje só há variantes por
    // plataforma (bedrock, vertex_ai, regionais). O teste aceita qualquer uma.
    const { modelo, viaFallback } = acharModelo(
        modelos,
        'claude-3-5-haiku-20241022',
        /claude-3-5-haiku-20241022/
    );
    if (!ok(Boolean(modelo), 'alguma variante de claude-3-5-haiku-20241022 está no catálogo')) return;
    if (viaFallback) console.log(`    (id exato ausente; usando "${modelo.id}")`);

    ok(typeof modelo.provider === 'string' && modelo.provider.length > 0, 'provider preenchido');
    igual(modelo.mode, 'chat', 'mode é chat');
    ok(typeof modelo.context_length === 'number' && modelo.context_length > 0, 'context_length numérico');
    ok(
        typeof modelo.pricing.input_cost_per_token === 'number' && modelo.pricing.input_cost_per_token > 0,
        'preço de entrada positivo'
    );
    ok(modelo.capacidades.includes('tools'), 'anuncia function calling');
    ok(!modelo.name.startsWith(modelo.provider + '/'), 'nome exibido não repete o prefixo do provedor');
}

function testarEmbedding(modelos, cru) {
    console.log('\n▸ text-embedding-3-small (embedding)');
    const { modelo } = acharModelo(modelos, 'text-embedding-3-small', /text-embedding-3-small$/);
    if (!ok(Boolean(modelo), 'modelo de embedding está no catálogo')) return;

    const bruto = cru[modelo.id];
    igual(modelo.mode, 'embedding', 'mode é embedding');
    ok(modelo.architecture.output_modalities.includes('embedding'), 'saída derivada do mode é "embedding"');
    igual(modelo.pricing.output_cost_per_token, bruto.output_cost_per_token, 'custo de saída preservado (0 para embeddings)');
    igual(modelo.supported_parameters.includes('temperature'), false, 'não recebe os parâmetros de chat');
    ok(modelo.params_base.length === 0, 'sem base de chat para modo não conversacional');
}

function testarModoSemPreco(modelos) {
    console.log('\n▸ modelos sem preço');
    const semPreco = modelos.filter(m => Object.keys(m.pricing).length === 0);
    ok(semPreco.length > 0, `há modelos sem nenhum campo de custo (${semPreco.length})`);
    ok(
        semPreco.every(m => m.pricing && typeof m.pricing === 'object'),
        'ausência de preço vira objeto vazio, nunca undefined'
    );
}

function testarSanidadeGeral(modelos, cru, mod) {
    console.log('\n▸ sanidade do catálogo inteiro');
    ok(modelos.length > 1000, `catálogo com muitos modelos (${modelos.length})`);

    for (const chave of mod.CHAVES_NAO_MODELO) {
        igual(modelos.some(m => m.id === chave), false, `"${chave}" foi filtrado`);
    }

    const semProvider = modelos.filter(m => typeof m.provider !== 'string' || !m.provider);
    igual(semProvider.length, 0, 'todo modelo normalizado tem provider');

    const comBarra = modelos.filter(m => m.id.includes('/'));
    ok(comBarra.length > 0, `ids com barra sobrevivem (${comBarra.length})`);

    const resolucao = modelos.find(m => /^\d+-x-\d+\//.test(m.id));
    if (resolucao) {
        ok(
            resolucao.name === resolucao.id,
            'chave com prefixo de resolução não é confundida com prefixo de provedor',
            `name="${resolucao.name}" id="${resolucao.id}"`
        );
    }

    // Nenhum NaN em lugar nenhum: é o que produziria "$NaN" na interface.
    const numericos = ['context_length', 'max_output_tokens', 'output_vector_size'];
    const comNaN = modelos.filter(m =>
        numericos.some(c => typeof m[c] === 'number' && Number.isNaN(m[c])) ||
        Object.values(m.pricing).some(v => typeof v !== 'number' || !Number.isFinite(v))
    );
    igual(comNaN.length, 0, 'nenhum valor numérico é NaN ou infinito');

    // max_tokens legado só entra quando o campo dedicado falta
    const comAmbos = Object.entries(cru).find(([id, b]) =>
        b && typeof b === 'object' &&
        typeof b.max_input_tokens === 'number' &&
        typeof b.max_tokens === 'number' &&
        b.max_input_tokens !== b.max_tokens
    );
    if (comAmbos) {
        const [id, bruto] = comAmbos;
        const modelo = modelos.find(m => m.id === id);
        igual(modelo.context_length, bruto.max_input_tokens, `max_input_tokens tem precedência sobre max_tokens (${id})`);
    }

    const soLegado = Object.entries(cru).find(([, b]) =>
        b && typeof b === 'object' &&
        typeof b.litellm_provider === 'string' &&
        b.max_input_tokens === undefined &&
        typeof b.max_tokens === 'number'
    );
    if (soLegado) {
        const [id, bruto] = soLegado;
        const modelo = modelos.find(m => m.id === id);
        igual(modelo.context_length, bruto.max_tokens, `max_tokens usado como fallback (${id})`);
    }

    // Todo campo de custo do catálogo curado precisa existir na LiteLLM, senão
    // o rótulo ficou órfão depois de uma renomeação lá.
    const chavesReais = new Set();
    for (const bruto of Object.values(cru)) {
        if (!bruto || typeof bruto !== 'object') continue;
        Object.keys(bruto).filter(k => k.includes('cost')).forEach(k => chavesReais.add(k));
    }
    const orfaos = Object.keys(mod.PRICING_FIELDS).filter(k => !chavesReais.has(k));
    igual(orfaos.length, 0, 'nenhum campo do catálogo curado sumiu da LiteLLM', orfaos.join(', '));

    // Toda unidade referenciada precisa existir na tabela de conversão
    const unidadesInvalidas = [...chavesReais]
        .map(k => mod.descreverPreco(k).unit)
        .filter(u => !Object.hasOwn(mod.UNIDADES_PRECO, u));
    igual(unidadesInvalidas.length, 0, 'toda unidade inferida existe em UNIDADES_PRECO', [...new Set(unidadesInvalidas)].join(', '));
}

/* ------------------------------------------------------------------ */

async function main() {
    const mod = await carregarNormalizacao();
    const cru = await carregarCatalogo(process.argv[2]);

    const modelos = mod.normalizarModelos(cru);
    console.log(`→ ${Object.keys(cru).length} entradas no arquivo, ${modelos.length} modelos normalizados`);

    testarChat(modelos, cru);
    testarClaude(modelos);
    testarEmbedding(modelos, cru);
    testarModoSemPreco(modelos);
    testarSanidadeGeral(modelos, cru, mod);

    console.log(`\n${falhas ? '✗' : '✓'} ${checagens - falhas}/${checagens} checagens passaram.`);
    if (falhas) process.exit(1);
}

main().catch(erro => {
    console.error(`✗ ${erro.message}`);
    process.exit(1);
});
