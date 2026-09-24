#!/usr/bin/env node
// Regressões do catálogo multimodal, sem rede ou dependências externas.
// Opcional: node scripts/catalog.test.mjs /caminho/catalog.json
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const elements = new Map();
const element = id => {
    if (!elements.has(id)) elements.set(id, { value: '', innerHTML: '', textContent: '',
        classList: { add() {}, remove() {}, contains() { return false; } }, focus() {} });
    return elements.get(id);
};
const storage = new Map();
const context = vm.createContext({ console, URL, AbortSignal, setTimeout, clearTimeout,
    document: { addEventListener() {}, getElementById: element, body: { style: {} }, activeElement: null },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) }
});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const run = source => vm.runInContext(source, context);
const model = (output, extra = {}) => ({ id: 'test/' + output,
    architecture: { input_modalities: ['text'], output_modalities: [output] },
    pricing: { prompt: '0', completion: '0' }, ...extra });
const fixtures = ['text', 'image', 'audio', 'video', 'embeddings', 'decisions', 'transcription', 'speech', 'rerank', 'future'].map(x => model(x));
context.fixtures = fixtures;

test('consulta todas as modalidades em cada carregamento, sem reutilizar dados antigos', async () => {
    assert.match(run('MODELS_API_URL'), /output_modalities=all$/);
    storage.set('openrouter-models-cache-all-v2', JSON.stringify({ models: [], savedAt: Date.now() }));
    const requests = [];
    context.fetch = async (url, options) => {
        requests.push({ url, options });
        return { ok: true, json: async () => ({ data: fixtures }) };
    };
    context.initModels = models => { context.receivedModels = models; };
    await context.loadModels();
    await context.loadModels();
    assert.equal(requests.length, 2);
    assert.equal(requests[0].options.cache, 'no-store');
    assert.equal(requests[0].url, 'https://openrouter.ai/api/v1/models?output_modalities=all');
    assert.equal(context.receivedModels.length, fixtures.length);
});

test('parâmetros vêm da resposta do modelo, sem descrições locais', () => {
    const html = context.renderModelParameters({ supported_parameters: ['temperature', '<img src=x onerror=alert(1)>', 'temperature'] });
    assert.match(html, /Parâmetros anunciados \(2\)/);
    assert.match(html, /temperature/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(html, /<img src=x|Gerado em:|sincronizadas em/);
    assert.match(html, /openrouter\.ai\/docs\/api\/reference\/parameters/);
});

test('Jev, modalidades futuras e ausência de arquitetura não viram conversa', () => {
    assert.equal(context.isChatModel(fixtures[0]), true);
    for (const m of fixtures.slice(1)) {
        assert.equal(context.isChatModel(m), false);
        assert.doesNotMatch(context.renderRequestExamples(m), /chat\/completions/);
        assert.doesNotMatch(context.renderModelParameters(m), /data-param="messages"/);
    }
    assert.equal(context.isChatModel({ id: 'unknown' }), false);
    assert.equal(context.getModalities({ architecture: { modality: 'text->decisions' } }, 'output')[0], 'decisions');
    assert.equal(context.getModalities({ architecture: { output_modalities: [] } }, 'output')[0], 'unknown');
    assert.equal(context.getProvider({ id: '~typesafe/jev-latest' }), 'typesafe');
});

test('filtros de modalidade combinam OU dentro de cada filtro e E entre filtros', () => {
    run("allModels = fixtures; filtros.output.add('decisions'); filtros.output.add('embeddings')");
    assert.equal(run('getFilteredModels().length'), 2);
    assert.equal(run("opcoesDoFiltro('output').find(x => x.valor === 'image').contagem"), 1);
    run("filtros.input.add('audio')");
    assert.equal(run('getFilteredModels().length'), 0);
    run("filtros.input.clear(); filtros.output.clear()");
    element('textSearchInput').value = 'decisões';
    assert.equal(run('getFilteredModels()[0].id'), 'test/decisions');
    element('textSearchInput').value = '';
});

test('preços zerados de mídia não significam gratuidade e extras são considerados', () => {
    assert.equal(context.billingStatus(fixtures[0]), 'gratuitos');
    assert.equal(context.billingStatus(fixtures[4]), 'gratuitos');
    for (const output of ['image', 'video', 'audio', 'speech', 'rerank', 'transcription', 'future']) {
        assert.equal(context.billingStatus(model(output)), 'desconhecidos');
    }
    assert.equal(context.billingStatus(model('image', { id: 'test/image:free' })), 'gratuitos');
    assert.equal(context.billingStatus(model('text', { pricing: { prompt: '0', completion: '0', request: '0.01' } })), 'pagos');
    assert.equal(context.billingStatus(model('text', { pricing: { prompt: '-1', completion: '-1' } })), 'variaveis');
    assert.equal(context.billingStatus(model('text', { pricing: {} })), 'desconhecidos');
    assert.equal(context.billingStatus(model('text', { pricing: { prompt: '0', completion: '0', overrides: [{ request: '1' }] } })), 'pagos');
});

test('unidades desconhecidas não entram na ordenação numérica nem recebem conversão', () => {
    assert.equal(context.precoNumero(model('transcription', { pricing: { prompt: '0.00005' } }), 'prompt'), null);
    assert.equal(context.precoNumero(model('text', { pricing: { prompt: '0.00005' } }), 'prompt'), 0.00005);
    const entry = context.getPricingEntries({ new_price: '0.0004' }, fixtures[0])[0];
    assert.equal(entry.display, '0.0004');
    assert.equal(entry.unit, 'unknown');
    for (const value of ['', '1oops', Infinity, null, true]) assert.equal(context.priceNumber(value), null);
    assert.equal(context.formatPrice('0.000000002'), '$0.002');
});

test('horários e limiares de preços condicionais nunca viram preços', () => {
    const rendered = context.renderPricingOverrides([{ utc_start: 1600, utc_end: 2400,
        utc_days: ['monday'], min_prompt_tokens: 1000, prompt: '0.000001', future_condition: 42 }], fixtures[0]);
    assert.match(rendered, /1600/);
    assert.match(rendered, /future_condition/);
    assert.doesNotMatch(rendered, /1600000000|2400000000|42000000/);
    assert.match(rendered, /\$1.00/);
});

test('dados ausentes e texto externo são apresentados sem inventar ou executar HTML', () => {
    const m = { id: 'future/model', architecture: { tokenizer: '<img src=x onerror=alert(1)>',
        input_modalities: ['<script>'], output_modalities: ['future'] } };
    context.openModal(m);
    const rendered = element('modalBody').innerHTML;
    assert.match(rendered, /Não informado/);
    assert.match(rendered, /&lt;img/);
    assert.doesNotMatch(rendered, /<img src=x|<script>/);
    assert.equal(context.tokenLimit(fixtures[4], 0, true), 'Não se aplica');
});

test('todas as modalidades renderizam cartões, detalhes e comparação', () => {
    const models = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], 'utf8')).data : fixtures;
    context.catalog = models;
    for (const m of models) {
        assert.match(context.createModelCard(m), /model-card/);
        context.openModal(m);
        assert.ok(element('modalBody').innerHTML.length > 0, m.id);
    }
    run('allModels = catalog; filtros.comparar = new Set(catalog.slice(0, 4).map(m => m.id)); abrirComparacao()');
    assert.match(element('compareBody').innerHTML, /Modalidades/);
    assert.match(element('compareBody').innerHTML, /Cobrança/);
});
