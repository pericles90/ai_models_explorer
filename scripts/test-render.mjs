#!/usr/bin/env node
/**
 * Renderiza TODOS os modelos do catálogo da LiteLLM e falha se algum quebrar.
 *
 * Complementa o test-normalizacao.mjs: lá se valida o formato dos dados, aqui
 * se valida que a interface sobrevive a eles. O catálogo tem ~3 mil modelos com
 * combinações que ninguém revisa à mão — modelo sem preço, sem capacidade
 * nenhuma, com modo que a LiteLLM acabou de inventar. O que se procura aqui é
 * exceção e, principalmente, "NaN" ou "undefined" vazando para o HTML.
 *
 * Como funciona: o <script> inteiro do index.html é carregado como módulo, com
 * um stub mínimo de `document` (o único acesso ao DOM no topo do arquivo é um
 * addEventListener). Então as funções de render são chamadas com os dados reais.
 * Não há cópia de código: é o mesmo arquivo que vai para o navegador.
 *
 * Uso:
 *   node scripts/test-render.mjs                 # baixa o catálogo da LiteLLM
 *   node scripts/test-render.mjs catalogo.json   # usa um arquivo local
 *
 * Requer Node 18+ (fetch nativo). Sem dependências.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVO_HTML = join(raiz, 'index.html');
const CATALOGO_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json';

let falhas = 0;
const LIMITE_RELATO = 10;

function falhar(mensagem) {
    if (falhas < LIMITE_RELATO) console.error(`    ${mensagem}`);
    falhas++;
}

function grupo(descricao, corpo) {
    const antes = falhas;
    corpo();
    const novas = falhas - antes;
    console.log(`  ${novas ? '✗' : '✓'} ${descricao}${novas ? ` — ${novas} falha(s)` : ''}`);
    if (novas > LIMITE_RELATO) console.error(`    (${novas - LIMITE_RELATO} falha(s) além das exibidas)`);
}

/* ------------------------------------------------------------------ */

// O app não é um módulo: é um <script> que assume navegador. O stub cobre o
// mínimo para o topo do arquivo executar; se algum dia o app passar a mexer no
// DOM fora de função, este teste falha aqui — e é o aviso certo.
const STUB = `
globalThis.document = { addEventListener() {}, getElementById: () => null };
globalThis.window = globalThis;
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.fetch = async () => { throw new Error('sem rede neste teste'); };
`;

const EXPORTS = `
export { normalizarModelos, createModelCard, renderCapacidadesCard, renderPricingSection,
         getPricingEntries, formatPrice, createMinimalExample, createFullExample,
         CAMPOS_ORDENACAO };
`;

async function carregarApp() {
    const html = await readFile(ARQUIVO_HTML, 'utf8');
    const script = html.match(/<script>([\s\S]*)<\/script>/);
    if (!script) throw new Error('Bloco <script> não encontrado em index.html.');
    const url = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(STUB + script[1] + EXPORTS);
    return import(url);
}

async function carregarCatalogo(caminho) {
    if (caminho) {
        console.log(`→ Lendo catálogo local: ${caminho}`);
        return JSON.parse(await readFile(caminho, 'utf8'));
    }
    console.log(`→ Baixando catálogo: ${CATALOGO_URL}`);
    const resposta = await fetch(CATALOGO_URL, { headers: { Accept: 'application/json' } });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao baixar o catálogo.`);
    return resposta.json();
}

// "NaN" e "undefined" no HTML são o sintoma clássico de campo ausente tratado
// como presente. Nenhum dos dois tem motivo legítimo para aparecer na tela.
const VAZAMENTO = /NaN|undefined/;

/* ------------------------------------------------------------------ */

// O catálogo vem primeiro: o stub substitui o fetch global, então baixar
// depois de carregar o app cairia no próprio stub.
const cru = await carregarCatalogo(process.argv[2]);
const app = await carregarApp();
const modelos = app.normalizarModelos(cru);
console.log(`→ ${modelos.length} modelos normalizados\n`);

grupo(`${modelos.length} cards renderizados`, () => {
    for (const m of modelos) {
        let card;
        try {
            card = app.createModelCard(m);
        } catch (erro) {
            falhar(`✗ createModelCard lançou em "${m.id}": ${erro.message}`);
            continue;
        }
        if (VAZAMENTO.test(card)) falhar(`✗ card de "${m.id}" contém NaN/undefined`);
    }
});

grupo('preços e capacidades de todo modelo', () => {
    for (const m of modelos) {
        try {
            app.renderPricingSection(m.pricing);
            app.getPricingEntries(m.pricing);
            const caps = app.renderCapacidadesCard(m);
            if (VAZAMENTO.test(caps)) falhar(`✗ capacidades de "${m.id}" contêm NaN/undefined`);
        } catch (erro) {
            falhar(`✗ render de preços/capacidades lançou em "${m.id}": ${erro.message}`);
        }
    }
});

// Cada modo tem seu próprio corpo de requisição: um embedding precisa mostrar
// "input", não "messages". O exemplo mínimo é sempre model + um payload.
grupo('exemplo de requisição coerente com o modo', () => {
    for (const m of modelos) {
        let minimo;
        try {
            minimo = app.createMinimalExample(m);
            app.createFullExample(m);
        } catch (erro) {
            falhar(`✗ exemplo lançou em "${m.id}": ${erro.message}`);
            continue;
        }
        const chaves = Object.keys(minimo);
        if (chaves.length !== 2 || chaves[0] !== 'model') {
            falhar(`✗ exemplo mínimo de "${m.id}" deveria ser model + payload, veio: ${chaves.join(', ')}`);
        } else if (minimo[chaves[1]] === undefined) {
            falhar(`✗ payload "${chaves[1]}" de "${m.id}" (modo ${m.mode}) não tem exemplo`);
        }
    }
});

grupo('formatPrice resiste a valores de borda', () => {
    const unidades = ['token', 'pixel', 'character', 'image', 'second', 'page', 'query', 'request', 'unidade', 'unidade_inexistente'];
    const valores = [0, 1e-9, 1e-7, 0.5, 3, 1e6, -1, null, undefined, NaN, Infinity, 'x', {}];
    for (const unidade of unidades) {
        for (const valor of valores) {
            const saida = app.formatPrice(valor, unidade);
            if (VAZAMENTO.test(saida)) falhar(`✗ formatPrice(${String(valor)}, "${unidade}") = ${saida}`);
        }
    }
});

grupo(`${app.CAMPOS_ORDENACAO().length} campos de ordenação devolvem número ou null`, () => {
    for (const campo of app.CAMPOS_ORDENACAO()) {
        if (!campo.extrair) continue;   // ordenação por texto
        for (const m of modelos) {
            const v = campo.extrair(m);
            if (v === null || v === undefined) continue;
            if (typeof v !== 'number') falhar(`✗ "${campo.valor}" devolveu ${typeof v} em "${m.id}"`);
            else if (!Number.isFinite(v)) falhar(`✗ "${campo.valor}" devolveu não-finito em "${m.id}"`);
        }
    }
});

// Pior caso sintético: o modelo mais vazio que a normalização pode produzir,
// com um modo que a LiteLLM ainda não inventou.
grupo('modelo vazio com modo desconhecido', () => {
    const minimo = {
        id: 'provedor_novo/modelo', name: 'modelo', provider: 'provedor_novo',
        mode: 'modo_que_ainda_nao_existe',
        context_length: null, max_output_tokens: null, output_vector_size: null,
        pricing: {}, architecture: { input_modalities: ['text'], output_modalities: ['text'] },
        expiration_date: null, endpoints: [], capacidades: [],
        params_base: [], params_flags: [], supported_parameters: []
    };
    try {
        const card = app.createModelCard(minimo);
        if (VAZAMENTO.test(card)) falhar('✗ card do modelo vazio contém NaN/undefined');
        if (Object.keys(app.createMinimalExample(minimo)).length !== 2) {
            falhar('✗ modo desconhecido não produziu exemplo de requisição');
        }
    } catch (erro) {
        falhar(`✗ modelo vazio lançou: ${erro.message}`);
    }
});

console.log(`\n${falhas ? '✗' : '✓'} ${falhas ? `${falhas} falha(s)` : 'nenhuma falha de render'}.`);
if (falhas) process.exit(1);
