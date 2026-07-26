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
```

O script reescreve apenas o bloco entre os marcadores `// <auto:params>` e
`// </auto:params>` — não edite esse trecho à mão. Uma
[GitHub Action](.github/workflows/sync-params.yml) roda o sync semanalmente e
abre um PR quando a OpenRouter muda alguma descrição.

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
│   └── sync-params.yml               # Roda o sync semanalmente e abre PR
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
