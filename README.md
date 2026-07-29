# 🤖 Explorador de Modelos de IA Generativa

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)

Uma aplicação web que exibe informações sobre **milhares** de modelos de IA Generativa,
consumindo o catálogo oficial de preços e limites da [LiteLLM](https://github.com/BerriAI/litellm).

### 🔗 **[Acessar o explorador →](https://pericles90.github.io/ai_models_explorer/)**

<https://pericles90.github.io/ai_models_explorer/>

## 📡 Fonte de dados

Tudo vem de um único arquivo, buscado direto do repositório da LiteLLM:

```
https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json
```

É público, sem autenticação, e o `raw.githubusercontent.com` responde com
`Access-Control-Allow-Origin: *` — então o navegador busca em tempo real, sem
proxy e sem chave de API.

O arquivo é um **objeto dicionário** (`{ "<id do modelo>": { … } }`), não uma
lista. A chave é o id do modelo e é exatamente o que você passa em `model` numa
chamada via LiteLLM.

> Duas chaves não são modelos e são filtradas: **`sample_spec`** (documentação do
> próprio esquema, com texto livre no lugar dos números) e
> **`fallback_generalizations`**. Além delas, qualquer entrada sem
> `litellm_provider` é descartada. Na leitura usada para escrever este README:
> **2.984 entradas → 2.982 modelos**, de **122 provedores**.

## ✨ Funcionalidades

- 🔍 **Busca inteligente** por texto livre ou filtros combinados
- 📊 **Visualização em cards** com preços, contexto, tipo de modelo e capacidades
- 💰 **Preços completos** — entrada, saída, raciocínio, cache, imagem, áudio, pixel, segundo, página e por requisição
- 🧩 **Tipo de modelo** — 15 modos mapeados (chat, embedding, geração de imagem, transcrição, OCR, rerank…)
- ☑️ **Capacidades** — selos derivados das flags `supports_*` (tools, visão, raciocínio, cache, PDF, áudio, vídeo…)
- ⏳ **Descontinuação** — data de `deprecation_date`, destacada quando próxima
- 🗓️ **Filtro por descontinuação** — modelos já descontinuados ou prestes a sair (7, 30, 90 dias ou 1 ano)
- ☑️ **Filtros multi-seleção com busca** — digite para localizar e marque vários provedores, modelos, tipos, parâmetros ou faixas
- ↕️ **Ordenação** — 23 campos (contexto, saída, capacidades, descontinuação e todos os preços do catálogo) nas duas direções
- 💵 **Filtro de cobrança** — separe gratuitos, pagos e os que não informam preço
- ⚖️ **Modo comparar** — selecione modelos e veja-os lado a lado, com o melhor de cada linha destacado
- 📋 **Detalhes completos** de cada modelo em modal interativo
- 🔧 **Documentação de parâmetros** com explicações e exemplos por modo
- 📱 **Design responsivo** para desktop, tablet e mobile
- ⚡ **Zero dependências** - apenas HTML, CSS e JavaScript

## 🗺️ Mapeamento do esquema

O explorador nasceu apontado para a API da OpenRouter, cujo formato era bem
diferente. A tradução acontece num único bloco de normalização no `index.html`:

| Campo interno | Vem de | Observação |
|---------------|--------|------------|
| `id` | a própria chave do dicionário | ids com barra são válidos (`bedrock/…`, `1024-x-1024/dall-e-3`) |
| `name` | id sem o prefixo `<provedor>/` | só remove quando o prefixo é *mesmo* o provedor |
| `provider` | `litellm_provider` | campo obrigatório: sem ele, a entrada é descartada |
| `mode` | `mode` | dirige modalidades, parâmetros e exemplo de requisição |
| `context_length` | `max_input_tokens` → `max_tokens` | |
| `max_output_tokens` | `max_output_tokens` → `max_tokens` | |
| `output_vector_size` | `output_vector_size` | só embeddings (60 modelos) |
| `pricing` | todos os campos `*cost*` | mantidos com o **nome cru** da LiteLLM |
| `architecture` | flags `supports_*` + `mode` | a LiteLLM não publica lista de modalidades por modelo |
| `expiration_date` | `deprecation_date` | 92 modelos informam |
| `endpoints` | `supported_endpoints` | 566 modelos informam |
| `capacidades` | flags `supports_*` | selos no card |
| `supported_parameters` | base do modo + flags | ver [Parâmetros](#-parâmetros-documentados) |

### Por que `max_tokens` só entra como último recurso

`max_tokens` é **legado e ambíguo** no catálogo: em modelos antigos significa
contexto de entrada, em outros o limite de saída. `max_input_tokens` e
`max_output_tokens` são os campos corretos e têm precedência sempre; `max_tokens`
só é lido quando o dedicado falta. O teste de normalização cobre os dois casos com
modelos reais do arquivo.

## 💰 Preços Exibidos

Todo campo com `cost` no nome entra no card — não apenas entrada e saída. Na
leitura usada aqui, o arquivo tem **75 campos de custo distintos**, dos quais 18
têm rótulo curado e os outros 57 são descritos por inferência a partir do nome.

| Grupo | Exemplos de campo | Unidade exibida |
|-------|-------------------|-----------------|
| 📝 Tokens de texto | `input_cost_per_token`, `output_cost_per_token`, `output_cost_per_reasoning_token` | por 1M tokens |
| ⚡ Cache de prompt | `cache_read_input_token_cost`, `cache_creation_input_token_cost`, `…_above_1hr` | por 1M tokens |
| 🖼️ Multimodal | `input_cost_per_image`, `output_cost_per_image`, `input_cost_per_pixel`, `input_cost_per_audio_token`, `input_cost_per_second` | por imagem / 1M pixels / 1M tokens / segundo |
| 🧩 Extras | `input_cost_per_request`, `input_cost_per_query`, `ocr_cost_per_page` | por unidade |
| 📈 Faixas e modos | `input_cost_per_token_above_200k_tokens`, `…_batches`, `…_flex` | conforme o campo |

**Os preços já são números** no arquivo da LiteLLM (custo por *uma* unidade), não
strings como na API antiga — o código não usa `parseFloat` em nenhum ponto do
caminho de preço. A conversão para a unidade exibida é feita por um fator
declarado por unidade (×1.000.000 para token, pixel e caractere; ×1 para imagem,
segundo, página, consulta e requisição).

### Campos novos e desconhecidos

A LiteLLM adiciona campos de custo com frequência. Um campo fora do catálogo
curado **não é ignorado nem exibido errado**: o nome é analisado para inferir
unidade e grupo (`_per_pixel` → pixel, `cache_` → cache, `_above_` → faixas) e o
rótulo é humanizado a partir da própria chave. Se nem a inferência resolver, ele
cai em **❓ Outros preços**, com o valor bruto e sem assumir unidade.

Cada preço também mostra o **valor bruto em USD** exatamente como veio do arquivo.

### Modelos sem preço

**117 modelos não têm nenhum campo de custo** e **113 têm todos os campos em
zero**. Os dois casos são tratados explicitamente:

- ausência de preço vira `{}` — nunca `undefined`, nunca `NaN` na tela
- valor `0` é exibido como **Grátis**, não como `$0.00`
- valor negativo (sentinela de "depende") vira **Variável**
- ordenar por preço joga quem não tem o campo para o **fim**, nas duas direções

O teste automatizado falha se qualquer modelo produzir `NaN` ou `Infinity`.

## 🧩 Tipos de modelo e modalidades

Só **360 dos ~3.000 modelos** trazem `supported_modalities` explícito. Quando o
campo existe, ele é a verdade; quando falta, as modalidades são **derivadas** do
`mode` e das flags `supports_*`:

| `mode` | Rótulo | Entrada → Saída | Corpo da requisição |
|--------|--------|-----------------|---------------------|
| `chat`, `completion`, `responses` | Chat / Completion / Responses | texto → texto | `messages` |
| `realtime` | Tempo real | texto, áudio → texto, áudio | `messages` |
| `embedding`, `vector_store` | Embedding / Vector store | texto → vetor | `input` |
| `moderation` | Moderação | texto → classificação | `input` |
| `audio_speech` | Síntese de voz | texto → áudio | `input` |
| `image_generation`, `image_edit` | Geração / Edição de imagem | texto (+imagem) → imagem | `prompt` |
| `video_generation` | Geração de vídeo | texto → vídeo | `prompt` |
| `audio_transcription`, `ocr` | Transcrição / OCR | áudio ou imagem → texto | `file` |
| `rerank`, `search` | Rerank / Busca | texto → ranking | `query` |

As flags acrescentam o que o `mode` não conta, e valem mesmo quando
`supported_modalities` existe: `supports_vision` adiciona `image` à entrada,
`supports_pdf_input` adiciona `file`, `supports_audio_output` adiciona `audio` à
saída, e assim por diante.

Modo desconhecido (a LiteLLM cria novos) não quebra nada: aparece com o nome cru
e recebe o tratamento conservador de chat.

## ☑️ Capacidades

Substituem os benchmarks da fonte anterior — **a LiteLLM não publica benchmark
algum**, e exibir barras vazias seria pior que não exibir. No lugar entram selos
factuais, cada um vindo de uma flag booleana do catálogo:

| Selo | Flag | Modelos |
|------|------|--------:|
| tools | `supports_function_calling` | 1.666 |
| json schema | `supports_response_schema` | 878 |
| visão | `supports_vision` | 887 |
| raciocínio | `supports_reasoning` | 773 |
| cache | `supports_prompt_caching` | 622 |
| system | `supports_system_messages` | 617 |
| pdf | `supports_pdf_input` | 464 |
| web search | `supports_web_search` | 259 |
| computer use | `supports_computer_use` | 166 |
| áudio in / out | `supports_audio_input` / `supports_audio_output` | 104 / 61 |
| vídeo | `supports_video_input` | 54 |

**1.094 modelos não declaram nenhuma flag** e exibem o aviso correspondente —
ausência de flag significa "o catálogo não informa", não "não suporta".

### Modo comparar

Marque modelos pela caixa **comparar** no card. Uma barra flutuante lista os
selecionados como chips, cada um com **×** para remover — remover pelo chip
desmarca a caixa do card correspondente. Com **2 ou mais**, o botão Comparar abre
a tabela lado a lado: identificação, contexto, saída máxima, cada capacidade que
ao menos um dos modelos declara, e cada campo de preço que ao menos um deles
possui. O melhor valor de cada linha aparece em verde — considerando que **em
preço, menor é melhor**.

## 🔎 Filtros

Os seis filtros aceitam **múltipla seleção** e **busca por texto** dentro do
combo. As contagens ao lado de cada opção são calculadas no escopo dos *demais*
filtros (busca facetada), então o número exibido é o que aquela seleção entrega.

| Filtro | Combinação |
|--------|-----------|
| Provedor | OU — um modelo pertence a um provedor só |
| Modelo | OU |
| Tipo de modelo | OU — `mode` é um valor único por modelo |
| Parâmetro | **E ou OU**, alternável no rótulo do filtro |
| Descontinuação | OU — as faixas já são cumulativas entre si |
| Cobrança | OU — gratuitos, pagos e/ou sem preço informado |

> **Por que só Parâmetro tem o alternador E/OU?** Porque é o único filtro em que
> um modelo tem *vários* valores. `provider`, `mode` e nome são um valor por
> modelo, então "anthropic **E** openai" seria sempre vazio. As faixas de
> descontinuação são aninhadas (7d ⊂ 30d ⊂ 90d), então o E devolveria apenas a
> faixa mais estreita — nunca uma informação nova.

Filtros diferentes se combinam em **E**. Para isso não travar o uso, marcar um
modelo cujo provedor não está selecionado **adiciona aquele provedor** à seleção
— senão a escolha devolveria zero resultados sem explicação.

## ↕️ Ordenação

Campo e direção são controles separados, senão a lista passaria de 40 opções.
São **23 campos** × 2 direções.

| Grupo | Campos |
|-------|--------|
| Geral | Nome, Contexto de entrada, Saída máxima, Capacidades, Descontinuação |
| Preços | os 18 campos do catálogo curado — entrada, saída, raciocínio, cache (leitura, escrita, escrita acima de 1 h), áudio, imagem, pixel, por segundo, caractere, por requisição, por consulta, OCR por página |

Os campos de preço saem do mesmo registry `PRICING_FIELDS` usado na exibição, e
só aparecem quando ao menos um modelo os possui — campo novo no catálogo vira
ordenação automaticamente. Os 57 campos inferidos ficam **fora** da ordenação de
propósito: um seletor com 75 opções de preço seria inutilizável.

Modelos sem o dado do critério vão sempre para o **fim**, em qualquer direção:
ordenar por "mais barato" não pode trazer os sem preço na frente.

## 🗓️ Filtro por Descontinuação

O campo `deprecation_date` é a única informação de ciclo de vida no catálogo — não
existe flag de `deprecated` nem `status`. **92 modelos o informam**, e **83 deles
já passaram da data**. O filtro oferece faixas cumulativas, com a contagem ao
lado de cada uma; faixa sem nenhum modelo aparece desabilitada, em vez de sumir:

| Faixa | Critério |
|-------|----------|
| Já descontinuados | data anterior a hoje |
| Sai em até 7 / 30 / 90 dias / 1 ano | cumulativas — "30 dias" inclui o que sai em 7 |
| Sem prazo definido | `deprecation_date` ausente **ou** muito distante (ver abaixo) |

> **Datas sentinela:** datas a mais de 50 anos são tratadas como sem prazo —
> decisão do explorador, não do catálogo. O limiar é a constante
> `DIAS_PRAZO_IRRELEVANTE` em `index.html`. Datas fora do formato `YYYY-MM-DD`
> (o `sample_spec` traz texto livre ali) são ignoradas em vez de virarem
> `Invalid Date`.

## ⚡ Desempenho

São ~3.000 modelos, quase 10× o volume da fonte anterior. Renderizar tudo de uma
vez travava a página, então os cards saem em **lotes de 250** (`LOTE_CARDS`), com
um botão *Carregar mais* que informa quantos faltam. Filtro, busca e ordenação
sempre operam sobre a lista **inteira** — o lote afeta apenas o que está pintado
no DOM, nunca o resultado.

## 🔧 Parâmetros Documentados

A LiteLLM **não publica `supported_parameters` por modelo** — só flags de
capacidade. A lista exibida é montada em duas partes, e o modal diz de onde veio
cada uma:

1. **Base do modo** — os 14 parâmetros da interface OpenAI-compatível que a
   LiteLLM aceita em qualquer modelo conversacional. Modo não conversacional não
   recebe base nenhuma: um modelo de embedding não aceita `temperature`, e
   inventar isso seria pior que omitir.
2. **Derivados das flags** — cada flag habilita parâmetros concretos:
   `supports_function_calling` → `tools`, `supports_tool_choice` → `tool_choice`,
   `supports_reasoning` → `reasoning_effort`, `supports_prompt_caching` →
   `cache_control`, `supports_audio_output` → `modalities`, e assim por diante.

Flags que descrevem *comportamento* e não parâmetro (`supports_vision`,
`supports_system_messages`, `supports_assistant_prefill`) ficam de fora da lista:
aparecem como capacidade.

O exemplo de requisição também segue o modo — um modelo de embedding mostra
`input`, um de imagem mostra `prompt`, um de transcrição mostra `file`.

### De onde vêm as explicações

As descrições **não são escritas à mão no HTML**. Duas camadas se fundem:

1. **[Spec OpenAPI do proxy da LiteLLM](https://litellm-api.up.railway.app/openapi.json)**
   (`components.schemas.ProxyChatCompletionRequest` e `EmbeddingRequest`) —
   fornece tipo, valores aceitos (enum) e quais campos são obrigatórios. Estes
   nunca são sobrepostos: são fatos da API.
2. **[`params.pt-BR.json`](params.pt-BR.json)** — camada curada em português, que
   fornece o texto explicativo e os exemplos.

> **Diferença importante em relação à OpenRouter:** a spec da LiteLLM **não tem
> nenhum campo `description`**. Na fonte anterior, um parâmetro sem entrada
> curada caía na descrição em inglês da spec. Aqui não existe esse plano B: todo
> o texto explicativo nasce em `params.pt-BR.json`. Parâmetro sem entrada lá
> aparece com aviso explícito, em vez de texto inventado — e o sync avisa no
> terminal quais estão nessa situação.

O sync também compara os dois lados e reporta divergências: parâmetro que a
interface exibe mas ninguém documenta, e parâmetro documentado que nenhum modelo
exibe hoje. Para saber o que a interface exibe, ele lê o próprio bloco de
normalização do `index.html` — não uma lista paralela que envelheceria.

### Como chega no navegador

O site busca **`params.json` em runtime**, da mesma origem — por isso não esbarra
em CORS. Trocar as descrições é trocar esse arquivo, sem rebuild do HTML.

Se o `fetch` falhar (abertura via `file://`, WebView Android, offline), vale o
bloco `// <auto:params>` embutido no `index.html` como fallback. Os dois
artefatos saem do mesmo script, então nunca divergem.

> **Por que a spec não é buscada direto do navegador?** Ela não envia cabeçalho
> CORS — o `fetch` é bloqueado. (O catálogo em `raw.githubusercontent.com` envia
> `Access-Control-Allow-Origin: *`, e por isso é consumido em tempo real.) O
> script resolve isso na geração, e o `params.json` é servido da mesma origem do
> site.

## 🧪 Testes

```bash
node scripts/test-normalizacao.mjs                 # dados: baixa o catálogo real
node scripts/test-render.mjs                       # interface: renderiza todos os modelos
node scripts/test-normalizacao.mjs catalogo.json   # ambos aceitam um arquivo local
```

Nenhum dos dois é uma **cópia** do código de produção — os dois executam o
código do próprio `index.html`, então não existe versão de teste que possa
divergir da que vai para o navegador.

### `test-normalizacao.mjs` — os dados

Recorta o bloco entre os marcadores `// <normalizacao:inicio>` e
`// <normalizacao:fim>` e executa exatamente aquele código. É por isso que o
bloco é puro: nada de DOM, nada de estado global. Quebrar essa regra faz o teste
falhar na hora, em vez de o app quebrar só no navegador.

Além dos casos obrigatórios (`gpt-4o`, um Claude Haiku 3.5 e um modelo de
embedding), valida o catálogo inteiro: entradas não-modelo filtradas, todo modelo
com provedor, ids com barra preservados, precedência de `max_input_tokens`,
fallback de `max_tokens`, ausência total de `NaN`/`Infinity`, nenhum campo do
catálogo curado órfão depois de uma renomeação na LiteLLM, e toda unidade
inferida existindo na tabela de conversão. Hoje: **38 checagens**.

> O teste não fixa ids exatos como requisito: a LiteLLM renomeia e move chaves
> entre releases. Cada caso aceita um plano B por regex e avisa quando usou —
> assim um rename não deixa o teste vermelho pelo motivo errado.
> `claude-3-5-haiku-20241022` sem prefixo, por exemplo, **já não existe** no
> arquivo: só há variantes por plataforma.

### `test-render.mjs` — a interface

Carrega o `<script>` inteiro como módulo, com um stub mínimo de `document`, e
**renderiza os 2.982 modelos**. Não há navegador headless aqui; o que se procura
é exceção e, sobretudo, `NaN` ou `undefined` vazando para o HTML — o sintoma
clássico de campo ausente tratado como presente, e exatamente o risco de um
catálogo em que 117 modelos não têm preço e 1.094 não têm capacidade alguma.

Cobre: todos os cards, todas as seções de preço, o exemplo de requisição de cada
modo (um embedding tem de mostrar `input`, não `messages`), `formatPrice` contra
valores de borda em 10 unidades, os 23 campos de ordenação devolvendo número ou
`null`, e um modelo sintético vazio com um `mode` que a LiteLLM ainda não
inventou.

## 🚀 Demo

**No ar em <https://pericles90.github.io/ai_models_explorer/>** (GitHub Pages).

Também funciona abrindo o `index.html` direto no navegador, sem servidor.

## 📖 Uso

### Web
```bash
# Clone o repositório
git clone https://github.com/pericles90/ai_models_explorer.git

# Abra no navegador
open index.html
```

### Android (WebView)
O arquivo pode ser embarcado diretamente em uma WebView Android:

```kotlin
webView.loadUrl("file:///android_asset/index.html")
```

### Atualizando os parâmetros

```bash
node scripts/sync-params.mjs            # atualiza index.html + params.json
node scripts/sync-params.mjs --dry-run  # só mostra o que seria gerado
node scripts/sync-params.mjs --check    # falha se estiver desatualizado (CI)
```

O script reescreve apenas o bloco entre os marcadores `// <auto:params>` e
`// </auto:params>` — não edite esse trecho à mão. Uma
[GitHub Action](.github/workflows/sync-params.yml) roda o teste de normalização e
o sync semanalmente, e abre um PR quando algo muda.

## 🛠️ Stack

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização com variáveis CSS e grid/flexbox
- **JavaScript** - Lógica de aplicação (ES6+)
- **Dados** - Catálogo `model_prices_and_context_window.json` da LiteLLM

## 📁 Estrutura

```
.
├── index.html                        # Aplicação (com fallback de params embutido)
├── params.json                       # Gerado — buscado em runtime pelo site
├── params.pt-BR.json                 # Camada curada em português (editável à mão)
├── scripts/
│   ├── sync-params.mjs               # Funde a spec OpenAPI da LiteLLM + camada pt-BR
│   ├── test-normalizacao.mjs         # Valida a normalização contra o catálogo real
│   └── test-render.mjs               # Renderiza todos os modelos e caça NaN/undefined
├── .github/workflows/
│   └── sync-params.yml               # Roda os testes + sync semanalmente e abre PR
├── .gitattributes                    # Fixa LF nos arquivos gerados (ver abaixo)
└── README.md                         # Este arquivo
```

> **Sobre o `.gitattributes`:** `params.json`, `params.pt-BR.json` e os `.mjs`/`.yml`
> são fixados em LF. Sem isso, em máquinas com `core.autocrlf=true` o checkout os
> converteria para CRLF, o script (que grava LF) os reescreveria a cada execução
> e o `--check` acusaria desatualização sem nada ter mudado.

> **Sobre os números deste README:** as contagens (2.982 modelos, 122 provedores,
> 75 campos de custo…) são de uma leitura pontual do catálogo. A LiteLLM atualiza
> o arquivo várias vezes por semana, então espere variação. Nada no código
> depende desses valores.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abrir uma Pull Request

Antes de abrir o PR, rode `node scripts/test-normalizacao.mjs` e
`node scripts/test-render.mjs`.

## 📝 Licença

Este projeto está sob a [licença MIT](https://opensource.org/licenses/MIT).

## 🙏 Créditos

- Dados de preços e limites do projeto [LiteLLM](https://github.com/BerriAI/litellm) (BerriAI)
- Fontes: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) e [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

<p align="center">
  Feito com ❤️ para a comunidade de desenvolvedores de IA
</p>
