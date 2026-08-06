#!/usr/bin/env node
/**
 * Testes de scripts/sync-params.mjs (sem rede).
 *
 * O caso central usa os arquivos REAIS do commit 6a0d1c9, que a execução
 * agendada gerou contendo apenas a troca do carimbo de data — exatamente o
 * ruído que a comparação deve suprimir.
 *
 * Uso: node scripts/sync-params.test.mjs
 */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { semCarimboData } from './sync-params.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
let passou = 0;
let falhou = 0;

function verificar(nome, condicao, detalhe = '') {
    if (condicao) {
        console.log(`PASS  ${nome}`);
        passou++;
    } else {
        console.log(`FAIL  ${nome}${detalhe ? `  -> ${detalhe}` : ''}`);
        falhou++;
    }
}

// Lê um arquivo como estava em determinado commit; devolve null se o commit
// não existir (clone raso no CI, por exemplo), para o teste pular em vez de quebrar.
function arquivoNoCommit(commit, caminho) {
    try {
        return execFileSync('git', ['show', `${commit}:${caminho}`], { cwd: raiz, encoding: 'utf8' });
    } catch {
        return null;
    }
}

/* --- Caso real: commit que só trocou a data ------------------------- */

const ANTES = 'dc81e50';
const DEPOIS = '6a0d1c9';

const htmlAntes = arquivoNoCommit(ANTES, 'index.html');
const htmlDepois = arquivoNoCommit(DEPOIS, 'index.html');
const jsonAntes = arquivoNoCommit(ANTES, 'params.json');
const jsonDepois = arquivoNoCommit(DEPOIS, 'params.json');

if (htmlAntes && htmlDepois) {
    verificar('index.html: os dois commits realmente diferem (sanidade)', htmlAntes !== htmlDepois);
    verificar(
        'index.html: diferença só de data é ignorada',
        semCarimboData(htmlAntes) === semCarimboData(htmlDepois),
        'a comparação ainda enxerga diferença — o job comitaria à toa'
    );
    verificar(
        'index.html: a data some das duas formas',
        !/Gerado em: \d{4}-\d{2}-\d{2}/.test(semCarimboData(htmlDepois)) &&
        !/"geradoEm":\s*"\d{4}-\d{2}-\d{2}"/.test(semCarimboData(htmlDepois))
    );
} else {
    console.log('SKIP  histórico indisponível para index.html');
}

if (jsonAntes && jsonDepois) {
    verificar('params.json: os dois commits realmente diferem (sanidade)', jsonAntes !== jsonDepois);
    verificar(
        'params.json: diferença só de data é ignorada',
        semCarimboData(jsonAntes) === semCarimboData(jsonDepois)
    );
} else {
    console.log('SKIP  histórico indisponível para params.json');
}

/* --- Mudança real continua sendo detectada -------------------------- */

const comMudancaReal = (htmlDepois || '').replace('"service_tier"', '"service_tier_renomeado"');
if (htmlDepois) {
    verificar(
        'mudança de conteúdo AINDA é detectada',
        semCarimboData(htmlDepois) !== semCarimboData(comMudancaReal),
        'suprimir a data não pode suprimir mudança de verdade'
    );
}

/* --- Casos sintéticos ----------------------------------------------- */

verificar(
    'comentário "// Gerado em:" é removido',
    semCarimboData('// Gerado em: 2026-08-06\nx') === semCarimboData('// Gerado em: 2020-01-01\nx')
);

verificar(
    'campo JSON "geradoEm" é removido com ou sem espaço',
    semCarimboData('{"geradoEm":"2026-08-06"}') === semCarimboData('{"geradoEm": "2020-01-01"}')
);

verificar(
    'CRLF e LF comparam iguais',
    semCarimboData('a\r\nb') === semCarimboData('a\nb')
);

verificar(
    'datas fora do carimbo NÃO são apagadas',
    semCarimboData('lancado em 2024-05-01') === 'lancado em 2024-05-01'
);

console.log(`\n${passou} passaram, ${falhou} falharam`);
process.exit(falhou === 0 ? 0 : 1);
