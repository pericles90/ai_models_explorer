# 🤖 Explorador de Modelos de IA Generativa

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)

Uma aplicação web que exibe informações em tempo real sobre centenas de modelos de IA Generativa, consumindo dados diretamente da API oficial da [OpenRouter](https://openrouter.ai).

### 🔗 **[Acessar o explorador →](https://pericles90.github.io/ai_models_explorer/)**

<https://pericles90.github.io/ai_models_explorer/>

## ✨ Funcionalidades

- 🔍 **Busca inteligente** por texto livre ou filtros combinados
- 📊 **Visualização em cards** com preços, contexto e modalidade
- 💰 **Preços completos** — entrada, saída, cache (leitura/escrita 5 min/1 hora), multimodal e extras
- ⏳ **Ciclo de vida** — data de lançamento, data de expiração (destacada quando próxima) e knowledge cutoff
- 🗓️ **Filtro por expiração** — encontre modelos já expirados ou prestes a expirar (7, 30, 90 dias ou 1 ano)
- ☑️ **Filtros multi-seleção com busca** — digite para localizar e marque vários provedores, modelos, parâmetros ou faixas
- 📊 **Benchmarks no card** — índices de Inteligência, Código e Agêntico em barras comparáveis entre modelos
- ↕️ **Ordenação** — 19 campos (benchmarks, todos os preços da API, contexto, data, expiração) nas duas direções
- 💵 **Filtro de cobrança** — separe modelos gratuitos dos pagos
- ⚖️ **Modo comparar** — selecione modelos e veja-os lado a lado, com o melhor de cada linha destacado
- 📋 **Detalhes completos** de cada modelo em modal interativo
- 🔧 **Documentação de parâmetros** com explicações e exemplos
- 📱 **Design responsivo** para desktop, tablet e mobile
- ⚡ **Zero dependências** - apenas HTML, CSS e JavaScript

## 💰 Preços Exibidos

O explorador mostra **todos** os campos do objeto `pricing` retornado pela API, e não apenas entrada e saída.
Cada card lista todos os preços aplicáveis àquele modelo, todos com o mesmo padrão visual (rótulo + valor + unidade).
O modal traz a mesma informação agrupada por natureza, com rótulos completos:

| Grupo | Campos | Unidade |
|-------|--------|---------|
| 📝 Tokens de texto | `prompt`, `completion`, `internal_reasoning` | por 1M tokens |
| ⚡ Cache de prompt | `input_cache_read`, `input_cache_write` (5 min), `input_cache_write_1h` (1 hora), `input_audio_cache` | por 1M tokens |
| 🖼️ Multimodal | `image`, `image_output`, `audio`, `audio_output` | por 1M tokens |
| 🧩 Extras | `web_search`, `request` | por unidade |
| 📈 Condicionais | `overrides` (ex.: tabela diferente acima de 272K tokens de prompt) | conforme o campo |

Cada preço exibe também o **valor bruto em USD** exatamente como veio da API, para conferência.

> `request` segue mapeado por segurança, mas **nenhum modelo o informa hoje** —
> a OpenRouter o removeu da resposta. Ele só voltaria a aparecer se a API
> voltasse a enviá-lo.

Campos novos que a OpenRouter venha a adicionar aparecem automaticamente no grupo **❓ Outros preços**,
com o valor bruto e sem assumir unidade — evitando exibir um número convertido errado.

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

## 📊 Benchmarks

Vêm do campo `benchmarks` da API — *"third-party benchmark rankings for this model"*.
Duas fontes, com coberturas diferentes:

Dos 343 modelos, **168 trazem o objeto `benchmarks`** — mas as duas fontes têm
coberturas diferentes dentro desse grupo:

| Fonte | Modelos com dado | Conteúdo |
|-------|-----------------:|----------|
| `artificial_analysis` | 117 | Índices de Inteligência, Código e Agêntico |
| `design_arena` | 114 | ELO, win rate e colocação em 25 categorias de design |

> A spec marca `design_arena` como obrigatório dentro de `benchmarks`, mas **54
> modelos o trazem como array vazio** — ter o campo não significa ter dado.

No card aparecem os 3 índices, cada um como barra proporcional ao **maior valor
de toda a base** — por isso os cards continuam comparáveis entre si mesmo com
filtros aplicados. A barra do critério em uso na ordenação fica destacada em
verde. O Design Arena completo fica no modal e na comparação.

> **Não existe benchmark de SRE.** Buscamos por `sre`, `ops`, `devops`, `infra`
> e `reliability` nas 25 categorias e nos 3 índices: nenhuma ocorrência. `coding`
> existe; as demais categorias são todas de design/frontend. **175 dos 343
> modelos não têm benchmark algum** e exibem o aviso correspondente.

### Modo comparar

Marque modelos pela caixa **comparar** no card. Uma barra flutuante lista os
selecionados como chips, cada um com **×** para remover — remover pelo chip
desmarca a caixa do card correspondente. Com **2 ou mais**, o botão Comparar
abre a tabela lado a lado: os 3 índices, as categorias do Design Arena em que ao
menos um dos modelos pontua, e preços/contexto. O melhor valor de cada linha
aparece em verde — considerando que em `rank` do Arena e em preço, **menor é
melhor**.

## 🔎 Filtros

Os cinco filtros aceitam **múltipla seleção** e **busca por texto** dentro do
combo. As contagens ao lado de cada opção são calculadas no escopo dos *demais*
filtros (busca facetada), então o número exibido é o que aquela seleção entrega.

| Filtro | Combinação |
|--------|-----------|
| Provedor | OU — um modelo pertence a um provedor só |
| Modelo | OU |
| Parâmetro | **E ou OU**, alternável no rótulo do filtro |
| Expiração | OU — as faixas já são cumulativas entre si |
| Cobrança | OU — gratuitos (18) e/ou pagos (325) |

O alternador **E / OU** dos parâmetros muda bastante o resultado: marcar `tools`
e `reasoning` devolve 296 modelos em OU e 191 em E.

> **Por que só Parâmetro tem o alternador?** Porque é o único filtro em que um
> modelo tem *vários* valores. `getProvider()` devolve exatamente um provedor por
> modelo, então "anthropic **E** openai" seria sempre vazio; o mesmo vale para
> modelo. As faixas de expiração são aninhadas (7d ⊂ 30d ⊂ 90d), então o E
> devolveria apenas a faixa mais estreita — nunca uma informação nova.

Filtros diferentes se combinam em **E**. Para isso não travar o uso, marcar um
modelo cujo provedor não está selecionado **adiciona aquele provedor** à seleção
— senão a escolha devolveria zero resultados sem explicação.

## ↕️ Ordenação

Campo e direção são controles separados, senão a lista passaria de 35 opções:
são 12 campos de preço só na API de hoje. São **19 campos** × 2 direções.

| Grupo | Campos |
|-------|--------|
| Geral | Data de lançamento, Nome, Contexto, Expiração |
| Benchmarks | Inteligência, Código, Agêntico |
| Preços | Entrada, Saída, Raciocínio interno, Cache (leitura, escrita 5 min, escrita 1 h, áudio), Imagem (entrada/saída), Áudio (entrada/saída), Busca na web |

Os campos de preço saem do mesmo registry `PRICING_FIELDS` usado na exibição, e
só aparecem quando ao menos um modelo os possui — campo novo na API vira
ordenação automaticamente.

Modelos sem o dado do critério vão sempre para o **fim**, em qualquer direção:
ordenar por "mais barato" não pode trazer os sem preço na frente.

## 🗓️ Filtro por Expiração

O campo `expiration_date` da API é, segundo a spec, *"a data após a qual o modelo
**pode** ser removido"* — é o único campo de ciclo de vida (não existe flag de
`deprecated` nem `status`). O filtro oferece faixas cumulativas, com a contagem
de modelos ao lado de cada uma; faixa sem nenhum modelo aparece desabilitada, em
vez de sumir:

| Faixa | Critério |
|-------|----------|
| Já expirados | data anterior a hoje |
| Expira em até 7 / 30 / 90 dias / 1 ano | cumulativas — "30 dias" inclui o que vence em 7 |
| Sem prazo definido | `expiration_date` nulo **ou** muito distante (ver abaixo) |

> **Datas sentinela:** a spec não define um valor para "sem expiração" além de
> `null`, mas alguns modelos usam datas absurdamente distantes (ex.: `2098-12-31`).
> Datas a mais de 50 anos são tratadas como sem prazo — decisão do explorador,
> não da API. O limiar é a constante `DIAS_PRAZO_IRRELEVANTE` em `index.html`.

## 🔧 Parâmetros Documentados

As explicações dos parâmetros **não são escritas à mão**. Duas camadas se fundem:

1. **[Spec OpenAPI oficial da OpenRouter](https://openrouter.ai/openapi.json)**
   (`components.schemas.ChatRequest`) — fornece tipo, valores aceitos (enum),
   exemplo e valor padrão. Estes campos nunca são sobrepostos: são fatos da API.
2. **[`params.pt-BR.json`](params.pt-BR.json)** — camada curada em português, que
   sobrepõe apenas o texto explicativo e os exemplos.

Parâmetro sem entrada curada usa a descrição da spec (em inglês); parâmetro que
nem a spec descreve aparece com um aviso explícito, em vez de texto inventado.
O modal indica a origem de cada texto e a data da última sincronização.

### Como chega no navegador

O site busca **`params.json` em runtime**, da mesma origem — por isso não esbarra
em CORS. Trocar as descrições é trocar esse arquivo, sem rebuild do HTML.

Se o `fetch` falhar (abertura via `file://`, WebView Android, offline), vale o
bloco `// <auto:params>` embutido no `index.html` como fallback. Os dois
artefatos saem do mesmo script, então nunca divergem.

### Atualizando

```bash
node scripts/sync-params.mjs            # atualiza index.html + params.json
node scripts/sync-params.mjs --dry-run  # só mostra o que seria gerado
node scripts/sync-params.mjs --check    # falha se estiver desatualizado (CI)
node scripts/sync-params.test.mjs       # testa o comparador (sem rede)
```

O script reescreve apenas o bloco entre os marcadores `// <auto:params>` e
`// </auto:params>` — não edite esse trecho à mão. Uma
[GitHub Action](.github/workflows/sync-params.yml) roda o sync semanalmente
(segundas, 06:00 UTC) e comita direto na `main` quando a OpenRouter muda
alguma coisa. Execução sem novidade não gera commit: o script compara
ignorando o carimbo `geradoEm`.

> **Por que a spec não é buscada direto do navegador?** `openapi.json` não envia
> cabeçalho CORS — o `fetch` é bloqueado. (O `/api/v1/models` envia
> `Access-Control-Allow-Origin: *`, e por isso é consumido em tempo real.) O
> script resolve isso no build, e o `params.json` gerado é servido da mesma
> origem do site.

## 🛠️ Stack

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização com variáveis CSS e grid/flexbox
- **JavaScript** - Lógica de aplicação (ES6+)
- **API** - OpenRouter `/api/v1/models`

## 📁 Estrutura

```
.
├── index.html                        # Aplicação (com fallback de params embutido)
├── params.json                       # Gerado — buscado em runtime pelo site
├── params.pt-BR.json                 # Camada curada em português (editável à mão)
├── scripts/
│   └── sync-params.mjs               # Funde a spec OpenAPI + camada pt-BR
├── .github/workflows/
│   └── sync-params.yml               # Roda o sync semanalmente e comita na main
├── .gitattributes                    # Fixa LF nos arquivos gerados (ver abaixo)
└── README.md                         # Este arquivo
```

> **Sobre o `.gitattributes`:** `params.json`, `params.pt-BR.json` e os `.mjs`/`.yml`
> são fixados em LF. Sem isso, em máquinas com `core.autocrlf=true` o checkout os
> converteria para CRLF, o script (que grava LF) os reescreveria a cada execução
> e o `--check` acusaria desatualização sem nada ter mudado.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abrir uma Pull Request

## 📝 Licença

Este projeto está sob a [licença MIT](https://opensource.org/licenses/MIT).

## 🙏 Créditos

- Dados fornecidos pela [OpenRouter API](https://openrouter.ai/docs)
- Fontes: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) e [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

<p align="center">
  Feito com ❤️ para a comunidade de desenvolvedores de IA
</p>
