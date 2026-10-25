# Arquitetura implementada

```mermaid
flowchart LR
    U[Usuário] --> R[React no navegador]
    R --> H[useDestination]
    H --> G[Open-Meteo Geocoding]
    H --> W[Open-Meteo Forecast]
    H --> C[countries.dev]
    H --> F[Frankfurter]
    G --> S[src/services: validação Zod e normalização]
    W --> S
    C --> S
    F --> S
    S --> T[src/types: modelos internos]
    T --> R
    R --> A[/api/gemini: função no servidor]
    A --> M[Google Gemini]
```

A busca resolve a cidade em uma `Location`. Após a seleção, `useDestination` solicita clima e dados do país; o câmbio usa a moeda conhecida de alguns destinos ou a moeda retornada pelo serviço de países. Cada recurso tem estado próprio (`loading`, `success` ou `error`), permitindo exibir os outros cartões se uma API falhar. Uma nova busca cancela a anterior.

`src/services` faz as requisições HTTP, valida os JSONs externos com Zod e devolve apenas os modelos de `src/types` para a interface. Os quatro serviços públicos são chamados diretamente pelo navegador. O Gemini é chamado pela função `/api/gemini`; `GEMINI_API_KEY` permanece no ambiente do servidor. O histórico, favoritos e tema são dados locais do navegador, sem conta de usuário ou banco de dados.

O formato e a disponibilidade das respostas pertencem aos provedores externos. Por isso, `src/services/httpClient.ts` aplica timeout e erros normalizados, e a interface apresenta mensagens de falha em vez de JSON bruto.
