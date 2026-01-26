# 🤖 Explorador de Modelos de IA Generativa

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)

Uma aplicação web que exibe informações em tempo real sobre centenas de modelos de IA Generativa, consumindo dados diretamente da API oficial da [OpenRouter](https://openrouter.ai).

## ✨ Funcionalidades

- 🔍 **Busca inteligente** por texto livre ou filtros combinados
- 📊 **Visualização em cards** com preços, contexto e modalidade
- 📋 **Detalhes completos** de cada modelo em modal interativo
- 🔧 **Documentação de parâmetros** com explicações e exemplos
- 📱 **Design responsivo** para desktop, tablet e mobile
- ⚡ **Zero dependências** - apenas HTML, CSS e JavaScript

## 🚀 Demo

Abra o arquivo `openrouter-explorer.html` em qualquer navegador moderno.

## 📖 Uso

### Web
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/openrouter-explorer.git

# Abra no navegador
open openrouter-explorer.html
```

### Android (WebView)
O arquivo pode ser embarcado diretamente em uma WebView Android:

```kotlin
webView.loadUrl("file:///android_asset/openrouter-explorer.html")
```

## 🔧 Parâmetros Documentados

O explorador inclui explicações detalhadas para os principais parâmetros de API:

| Parâmetro | Descrição |
|-----------|-----------|
| `temperature` | Controle de criatividade/aleatoriedade |
| `top_p` | Amostragem por núcleo |
| `max_tokens` | Limite de tokens na resposta |
| `tools` | Definição de funções (Function Calling) |
| `stream` | Streaming via SSE |
| ... | E muitos outros |

## 🛠️ Stack

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização com variáveis CSS e grid/flexbox
- **JavaScript** - Lógica de aplicação (ES6+)
- **API** - OpenRouter `/api/v1/models`

## 📁 Estrutura

```
.
├── openrouter-explorer.html   # Aplicação completa (single-file)
├── README.md                  # Este arquivo
└── LICENSE                    # Licença MIT
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abrir uma Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Créditos

- Dados fornecidos pela [OpenRouter API](https://openrouter.ai/docs)
- Fontes: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) e [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

<p align="center">
  Feito com ❤️ para a comunidade de desenvolvedores de IA
</p>
