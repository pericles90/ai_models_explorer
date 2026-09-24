# 🤖 Explorador de Modelos de IA

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)

Uma aplicação web que exibe informações em tempo real sobre centenas de modelos de IA de todas as modalidades, consumindo dados diretamente da API oficial da [OpenRouter](https://openrouter.ai).

### 🔗 **[Acessar o explorador →](https://pericles90.github.io/ai_models_explorer/)**

<https://pericles90.github.io/ai_models_explorer/>

## Catálogo completo e compatibilidade

A página consulta `https://openrouter.ai/api/v1/models?output_modalities=all`. Isso inclui todas as modalidades disponibilizadas nessa consulta da OpenRouter, sem prometer cobertura de todos os modelos existentes no mercado.

- O catálogo é consultado diretamente da API a cada abertura, sem cópia local dos dados. A requisição usa `cache: 'no-store'`.
- Busca e filtros reconhecem texto, imagem, áudio, vídeo, arquivos, vetores, decisões, transcrição, síntese de voz e reordenação. Valores novos continuam visíveis.
- Exemplos de `chat/completions` são oferecidos somente quando há entrada de texto e a saída anunciada é exclusivamente texto. São exemplos básicos; modelos especializados podem exigir esquemas adicionais.
- Outras operações mostram um acesso à documentação do modelo, seus parâmetros anunciados e os dados completos recebidos. Não recebem campos obrigatórios ou exemplos de conversa por suposição.
- Campos ausentes aparecem como não informados. Limites de tokens sem aplicação são identificados, e os dados originais permanecem acessíveis nos detalhes.
- Preços zerados de texto não tornam um modelo de vídeo ou voz gratuito. A classificação considera outros preços e condições; quando não há confirmação, indica cobrança não confirmada.
- Comparações usam preços-base na mesma unidade. Valores de unidade desconhecida aparecem como texto, sem conversão nem destaque de menor preço.
- Os parâmetros exibidos são os nomes de `supported_parameters` retornados pela API para cada modelo. Explicações detalhadas ficam na documentação oficial da OpenRouter.

## ✨ Funcionalidades

- 🔍 **Busca inteligente** por texto livre ou filtros combinados
- 📊 **Visualização em cards** com preços, contexto e modalidade
- 💰 **Preços completos** — entrada, saída, cache (leitura/escrita 5 min/1 hora), multimodal e extras
- ⏳ **Ciclo de vida** — data de lançamento, data de expiração (destacada quando próxima) e knowledge cutoff
- 🗓️ **Filtro por expiração** — encontre modelos já expirados ou prestes a expirar (7, 30, 90 dias ou 1 ano)
- ☑️ **Filtros multi-seleção com busca** — digite para localizar e marque vários provedores, modelos, parâmetros ou faixas
- 📊 **Benchmarks no card** — índices de Inteligência, Código e Agêntico em barras comparáveis entre modelos
- ↕️ **Ordenação** — campos disponíveis (benchmarks, preços com unidade reconhecida, contexto, data, expiração) nas duas direções
- 💵 **Filtro de cobrança** — distinga gratuitos, pagos, variáveis e cobrança não confirmada
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
| 🖼️ Multimodal | `image`, `image_output`, `audio`, `audio_output` e campos futuros | unidade reconhecida ou valor bruto sem conversão |
| 🧩 Extras | `web_search`, `request` | por unidade |
| 📈 Condicionais | `overrides` (ex.: tabela diferente acima de 272K tokens de prompt) | conforme o campo |

Cada preço exibe também o **valor bruto** da API para conferência. A conversão para 1M tokens é usada somente nos campos e modalidades mapeados. Para operações de mídia ou unidades desconhecidas, o explorador preserva o valor bruto, informa a incerteza e não usa o valor em comparações numéricas. Condições como horários UTC e limites de contexto não são preços.

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

Os sete filtros aceitam **múltipla seleção** e **busca por texto** dentro do
combo. As contagens ao lado de cada opção são calculadas no escopo dos *demais*
filtros (busca facetada), então o número exibido é o que aquela seleção entrega.

| Filtro | Combinação |
|--------|-----------|
| Provedor | OU — um modelo pertence a um provedor só |
| Modelo | OU |
| Parâmetro | **E ou OU**, alternável no rótulo do filtro |
| Expiração | OU — as faixas já são cumulativas entre si |
| Cobrança | OU: gratuitos no catálogo, preço positivo, variável ou não confirmado |
| Modalidade de entrada | OU dentro do filtro |
| Modalidade de saída | OU dentro do filtro |

Parâmetros permitem escolher **E** (todos) ou **OU** (qualquer um). Modalidades usam **OU** dentro de cada filtro e **E** entre entrada e saída. Por exemplo, entrada de imagem e saída de vetores selecionam modelos que atendem aos dois critérios. As opções e contagens vêm do catálogo recebido, inclusive modalidades futuras.

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

## 🔧 Parâmetros dos modelos

A lista de parâmetros de cada modelo vem diretamente de `supported_parameters`
na resposta de `GET /api/v1/models?output_modalities=all`. A API fornece os
nomes anunciados, mas não inclui a descrição, o tipo e exemplos de cada
parâmetro nessa resposta. Por isso, o site mostra apenas o que recebeu e
oferece um link para a [documentação oficial dos parâmetros](https://openrouter.ai/docs/api/reference/parameters).

Não há cópia gerada ou tradução local dessas descrições. O suporte efetivo
pode variar entre operações e provedores; consulte a documentação do modelo
antes de montar uma requisição. Os exemplos de requisição presentes no site
são ilustrações construídas a partir dos parâmetros anunciados, não respostas
da API.

Para verificar o código localmente:

```bash
node scripts/catalog.test.mjs
# Opcional: valide também uma resposta salva da API completa
node scripts/catalog.test.mjs /caminho/catalog.json
```

## 🛠️ Stack

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização com variáveis CSS e grid/flexbox
- **JavaScript** - Lógica de aplicação (ES6+)
- **API** - OpenRouter `/api/v1/models`

## 📁 Estrutura

```
.
├── index.html                        # Aplicação e consulta direta da API
├── scripts/
│   └── catalog.test.mjs              # Testes locais do catálogo
├── .gitattributes                    # Normalização de texto e binários
└── README.md                         # Este arquivo
```

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

