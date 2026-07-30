# Avaliação: trocar a OpenRouter pela API da CloudPrice

> Data: 2026-07-30 · Escopo: substituir `https://openrouter.ai/api/v1/models` pela
> API de modelos da CloudPrice (`https://ai.cloudprice.net/api/v1/...`) como fonte
> de dados do explorador.

## Veredito

**Não é viável como substituição.** É viável — com trabalho não trivial — apenas como
**fonte complementar opcional**, e mesmo assim depende de uma verificação que não pôde
ser feita neste ambiente (CORS).

Quatro razões, em ordem de gravidade:

1. **CORS é requisito duro e não está confirmado.** O app é uma página estática sem
   backend; se a CloudPrice não enviar `Access-Control-Allow-Origin: *`, a troca é
   impossível sem introduzir um proxy/servidor — o que quebra a premissa "zero
   dependências" do projeto.
2. **Campos que a CloudPrice não publica derrubam 4 funcionalidades inteiras**:
   filtro de parâmetros, filtro de expiração, Design Arena e 8 das 13 dimensões de
   preço (o que reduz a ordenação de 19 para ~10 campos).
3. **O modelo de identidade é diferente**: a CloudPrice trata a *oferta*
   (modelo × provedor) como unidade; o app assume *um modelo, um provedor*. Isso
   invalida invariantes documentados no README e obriga a reescrever filtros e
   contagens facetadas.
4. **A troca não elimina a dependência da OpenRouter.** A documentação de parâmetros
   — uma das funcionalidades principais — vem do `openapi.json` da OpenRouter
   (`scripts/sync-params.mjs:35`). Trocar a fonte de modelos *adiciona* um segundo
   fornecedor em vez de substituir o primeiro.

## O que foi verificado, e o que não foi

Sinceridade sobre o método, porque isso muda o peso de cada conclusão:

| Lado | Como foi levantado | Confiança |
|------|--------------------|-----------|
| **Consumidor** (o que o app exige) | Lido linha por linha do `index.html` e do `scripts/sync-params.mjs` | Exato |
| **Fornecedor** (o que a CloudPrice entrega) | Documentação pública indexada em buscadores | **Não verificado contra resposta real** |

A política de rede deste ambiente bloqueia `cloudprice.net` e `ai.cloudprice.net`
(o proxy responde `403` ao `CONNECT`; o fetch de página também retorna `403`). Não
foi possível ler o `openapi.json` da CloudPrice nem inspecionar cabeçalhos de
resposta. Tudo que se refere ao **schema real, CORS, rate limit e termos de uso**
está marcado abaixo como *não verificado* e precisa de um teste em rede liberada
antes de qualquer decisão. O passo 0 do plano no fim deste documento é exatamente
esse teste.

## Restrições de arquitetura que qualquer fonte precisa respeitar

Não são preferências, são consequências de como o projeto é publicado:

- **Sem backend, sem build para dados.** O `fetch` sai do navegador do usuário
  (`index.html:1789`), com timeout de 15 s e cache em `localStorage` de 1 hora
  (`index.html:1615-1617`).
- **Precisa de CORS aberto.** O repositório já tem cicatriz disso: o
  `openapi.json` da OpenRouter *não* envia cabeçalho CORS, e por isso é consumido
  no build em vez do navegador (`scripts/sync-params.mjs:17-21`). O
  `/api/v1/models`, que envia `Access-Control-Allow-Origin: *`, é consumido ao vivo.
- **Não pode existir chave de API.** É um site estático público: qualquer token
  ficaria legível no fonte. O tier gratuito da CloudPrice é anunciado como
  "public endpoints, no auth required" — o que ajuda, mas então o rate limit
  passa a ser por IP do *visitante*, não da aplicação (não verificado).
- **Precisa funcionar em `file://` e WebView Android** (documentado no README).
  Nesse contexto a origem é opaca; um CORS restrito a domínios específicos
  falharia mesmo passando no GitHub Pages.

## Inventário: tudo que o app consome de `/api/v1/models`

| Campo da OpenRouter | Para que serve no app | Onde | Equivalente na CloudPrice |
|---|---|---|---|
| `id` (`"provedor/modelo"`) | Deriva o provedor por split em `/`; chave do filtro de modelos; link de doc | `index.html:1637`, `2109-2115` | **Formato incompatível** — slugs como `openai-gpt-5-5`, sem `/` |
| `name`, `description` | Título do card/modal e descrição | `index.html:1641`, `3243` | Provável (não verificado) |
| `created` (Unix) | Data de lançamento e ordenação padrão | `index.html:1822`, `2746` | Não verificado |
| `context_length` | Card, modal, comparação, ordenação | `index.html:2744`, `3192` | **Sim** (exibido no site) |
| `architecture.modality` / `.tokenizer` / `.input_modalities` / `.output_modalities` | Modalidade no card; 4 campos do modal | `index.html:2745`, `3179`, `3193-3212` | Parcial — capabilities existem, tokenizador improvável |
| `top_provider.is_moderated` / `.max_completion_tokens` | 2 campos do modal | `index.html:3180`, `3202-3206` | **Semanticamente inexistente** — não há "top provider" quando a unidade é a oferta |
| `supported_parameters[]` | Filtro com alternador E/OU + contagem facetada; linha da comparação; split obrigatórios/opcionais no modal; alimenta o script de params | `index.html:1826`, `2120`, `2412`, `2598`, `3387`; `sync-params.mjs:292-296` | **Ausente** — é conceito da camada de roteamento da OpenRouter |
| `pricing.*` (13 chaves) | Preços do card e modal, 12 campos de ordenação, filtro gratuito/pago | `index.html:2927-2986`, `1943`, `2019` | **Parcial** — o site expõe Input, Output, Cache Read, Cache Write |
| `pricing.overrides[]` | Preços condicionais (ex.: tabela acima de 272K tokens) | `index.html:3124-3157` | Não verificado, improvável |
| `expiration_date` (`AAAA-MM-DD`) | Filtro de expiração inteiro (6 faixas), badge no card, campo de ordenação, corte de data sentinela | `index.html:2677-2700`, `2749-2758`, `3224` | **Ausente** — campo próprio da OpenRouter |
| `knowledge_cutoff` | Campo do modal | `index.html:3232` | Não verificado |
| `benchmarks.artificial_analysis.{intelligence,coding,agentic}_index` | 3 barras no card, 3 campos de ordenação, comparação | `index.html:1867-1893` | **Provável** — o site anuncia benchmarks de inteligência |
| `benchmarks.design_arena[]` (`key`, `elo`, `win_rate`, `rank`, `class`, `dataset`) | Modal, comparação em até 25 categorias | `index.html:1895-1900`, `2573-2590`, `2808` | **Ausente** |

### Duas armadilhas silenciosas

- **Unidade de preço.** A OpenRouter devolve *USD por token, como string*; o app
  multiplica por `1e6` para exibir (`index.html:3073`, `2594-2596`). O endpoint de
  cálculo da CloudPrice (`?input_tokens=1500&output_tokens=500`) indica preços em
  USD por 1M. Sem normalização explícita na adaptação, todo preço sai errado por
  seis ordens de magnitude — **sem erro de execução**, apenas números plausíveis e
  falsos.
- **Convenção de sentinela.** `-1` significa "preço variável" (`openrouter/auto`)
  e é tratado como não ordenável (`index.html:1955`). Se a CloudPrice usar `null`,
  `0` ou omissão para o mesmo caso, modelos de roteamento aparecem como "Grátis".
  Vale lembrar que `ehGratuito()` só olha `prompt` e `completion`
  (`index.html:2019`) — e os 18 gratuitos de hoje são as variantes `:free` da
  OpenRouter, que não existem em uma tabela de preço de lista de provedor.

## Impacto por funcionalidade

| Funcionalidade | Situação após a troca |
|---|---|
| Cards, busca, modal básico | Preservada |
| Contexto, modalidade | Preservada |
| Benchmarks (3 índices) | Provavelmente preservada — fonte é a mesma (Artificial Analysis) |
| Preços completos (13 dimensões) | **Degradada** para ~4-5 dimensões |
| Ordenação (19 campos) | **Degradada** para ~10 |
| Filtro de parâmetros (E/OU) | **Perdida** |
| Filtro de expiração (6 faixas) | **Perdida** |
| Design Arena (modal + comparação) | **Perdida** |
| Filtro gratuito/pago | **Perdida na prática** (sem variantes `:free`) |
| Modo comparar | Sobrevive com menos linhas |
| Documentação de parâmetros | Continua dependendo da OpenRouter |

## O bloqueio estrutural: oferta ≠ modelo

O detalhe mais fácil de subestimar. A própria documentação da CloudPrice descreve o
endpoint de cálculo como algo que devolve "the cheapest matching provider plus every
option ranked by total cost" — ou seja, **o mesmo modelo tem N preços**, um por
provedor (Bedrock, Azure, Together, Scaleway...). É justamente o valor do produto
deles.

O app assume o contrário, e assume de forma documentada. O README explica que só o
filtro de Parâmetro tem alternador E/OU *porque* `getProvider()` devolve exatamente
um provedor por modelo — "anthropic **E** openai" seria sempre vazio. Com dados de
oferta, isso deixa de ser verdade: ou o mesmo modelo passa a aparecer várias vezes
na grade (quebrando as contagens facetadas, que usam `m.id` como chave única em
`index.html:2109-2115`), ou é preciso colapsar as ofertas e escolher uma — e aí a
decisão de *qual* preço mostrar passa a ser do explorador, não da API. Nenhum dos
dois é uma adaptação de campo; os dois são redesenho de modelo de dados.

## O que a CloudPrice traz de ganho real

Para não parecer avaliação enviesada — os ganhos existem e são relevantes, só não
são o que este app faz:

- **Catálogo muito maior**: ~2.955 modelos em 99 provedores anunciados, contra 343
  hoje. Inclui provedores diretos (Bedrock, Azure, Vertex) que a OpenRouter não
  intermedia.
- **Preço de lista do provedor**, sem a camada de repasse da OpenRouter.
- **Endpoint de cálculo de custo** por uso real de tokens/cache, com ranking de
  provedores — algo que hoje o app não faz e teria que ser construído do zero.

Isso descreve um produto adjacente: *"onde rodar este modelo mais barato"*, e não
*"que modelos existem e o que cada um aceita"*. Se o objetivo mudou nessa direção,
a conversa deixa de ser troca de API e passa a ser escopo novo.

## Se a decisão for seguir: caminho de menor risco

Ordem pensada para que cada passo possa reprovar a ideia antes do passo caro.

**Passo 0 — validar CORS e schema (1 hora, não pode ser pulado).**
Rodar em rede liberada, no console do navegador, a partir de
`https://pericles90.github.io`:

```js
const r = await fetch('https://ai.cloudprice.net/api/v1/models');
console.log(r.status, r.headers.get('access-control-allow-origin'));
const j = await r.json();
console.log(Object.keys(j), JSON.stringify((j.data ?? j)[0], null, 2));
```

Sem `access-control-allow-origin: *` na resposta, **a avaliação termina aqui**:
não há troca possível sem backend. Se passar, o `openapi.json` deles responde o
resto do inventário acima.

**Passo 1 — camada adaptadora.** Introduzir `normalizarModelo(bruto, fonte)` que
converte qualquer fonte para o shape interno já usado, resolvendo explicitamente:
unidade de preço (sempre USD/token internamente), `id` sintético no formato
`provedor/modelo`, e sentinela de preço variável. Sem essa camada, os campos da
CloudPrice espalham `?.` por todo o arquivo.

**Passo 2 — modo aditivo, não substitutivo.** Fonte selecionável, OpenRouter como
padrão. Funcionalidade sem dado na fonte ativa deve ser **desabilitada com aviso**,
seguindo o padrão que o app já usa para faixa de expiração vazia (opção
desabilitada em vez de sumir) — nunca exibida vazia como se o dado não existisse.

**Passo 3 — invalidar o cache.** Trocar `MODELS_CACHE_KEY`
(`index.html:1615`, hoje `openrouter-models-cache-v1`). Sem isso, visitantes
recorrentes renderizam payload antigo da OpenRouter contra o código novo por até
uma hora.

**Antes de publicar:** checar os termos de uso da CloudPrice. A OpenRouter é fonte
primária dos próprios dados; a CloudPrice é agregador comercial com tier Pro pago,
e republicar dado agregado em site público pode ter restrição contratual. Não foi
possível ler os termos deste ambiente.

## Recomendação

Manter a OpenRouter como fonte primária. Se o interesse for preço comparado entre
provedores — que é onde a CloudPrice é genuinamente melhor —, tratar como
funcionalidade nova e aditiva (uma seção "onde rodar mais barato" no modal,
alimentada pelo endpoint de cálculo), depois do passo 0, em vez de trocar a base de
dados do explorador e perder quatro filtros e nove critérios de ordenação.

---

### Fontes consultadas

- [CloudPrice — Free LLM Pricing API](https://cloudprice.net/models/api) (não acessível deste ambiente)
- [CloudPrice — AI Models Pricing & Benchmarks](https://cloudprice.net/models)
- [CloudPrice — AI Model Providers](https://cloudprice.net/models/providers)
- [OpenRouter — Models](https://openrouter.ai/docs/guides/overview/models)
- Código deste repositório: `index.html`, `scripts/sync-params.mjs`, `README.md`
