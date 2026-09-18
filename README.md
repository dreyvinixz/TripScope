# TravelAI

Aplicação web para pesquisar um destino e reunir, em uma única tela, localização, clima, informações do país e uma cotação indicativa de BRL para a moeda local. Os dados factuais vêm de Web Services externos e são convertidos para modelos internos antes de chegarem aos componentes React.

## Stack

- React 19, TypeScript estrito e Vite
- Tailwind CSS
- `fetch` com timeout e erros de domínio normalizados
- Zod para validação em runtime das respostas externas
- Vitest + Testing Library para testes determinísticos
- Playwright para smoke tests E2E
- Vercel Function apenas para a integração futura com Gemini

## APIs utilizadas

| Serviço | Uso |
|---|---|
| Open-Meteo Geocoding | cidade, país, ISO, coordenadas e timezone |
| Open-Meteo Forecast | clima atual e cinco dias de previsão |
| REST Countries | nome, bandeira, capital, população, idiomas, moedas e fusos |
| Frankfurter | cotação de BRL para a moeda do destino |

As respostas dessas APIs são DTOs privados dos serviços. A interface recebe somente os modelos em `src/types` (`Location`, `WeatherReport`, `Country` e `CurrencyQuote`).

## Estrutura principal

```text
src/
  components/    interface React
  hooks/         orquestração do fluxo de destino
  services/      HTTP, validação e normalização das APIs
  types/         contratos internos
  utils/         formatação, validação e códigos meteorológicos
tests/
  fixtures/      payloads mínimos e sanitizados
  unit/          testes determinísticos
  contract/      smoke tests opcionais contra APIs públicas
api/             função serverless do Gemini
docs/             arquitetura, relatório e apresentação
```

## Execução local

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm run dev
```

Abra a URL exibida pelo Vite, normalmente `http://localhost:5173`.

## Comandos de qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`test:e2e` executa a matriz Chromium desktop, tablet e mobile com fixtures determinísticas. Os artefatos de trace, screenshot e vídeo são preservados somente quando um teste falha. Para validar uma implantação pública sem iniciar o Vite local:

```bash
$env:E2E_BASE_URL='https://seu-deploy.example.com'
npm run test:e2e -- --grep "\[public\]" --project=desktop-chromium
```

O smoke público é opcional e fica ignorado quando `E2E_BASE_URL` não está definida. A integração contínua executa instalação limpa, lint, tipos, testes unitários, cobertura, build e a matriz E2E. O workflow também pode executar o smoke público quando a variável de repositório `E2E_BASE_URL` estiver configurada.

Os testes unitários usam fixtures e mocks, portanto não dependem da disponibilidade das APIs. Para executar o teste de contrato opcional contra os endpoints públicos:

```bash
npm run test:contract
```

Esse teste pode falhar por instabilidade, limite ou indisponibilidade de um serviço externo e não substitui a suíte determinística.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` quando precisar executar a integração server-side:

```bash
GEMINI_API_KEY=sua-chave-local
```

A chave do Gemini deve permanecer no servidor, nunca em código do cliente, fixtures ou artefatos versionados. As APIs públicas de geocodificação, clima, países e câmbio não exigem credenciais.

## Tratamento de erros

Os serviços convertem falhas para `ServiceError` com códigos conhecidos: `not-found`, `timeout`, `network`, `unavailable`, `unexpected-response` e `unsupported-currency`. Isso permite que a interface preserve dados já carregados quando um serviço secundário falhar.

## Estado do projeto

A Sprint 0 foi concluída. A Sprint 1 implementou os contratos e normalizadores dos Web Services, validação em runtime, cinco dias de previsão, mapeamento meteorológico acessível, fixtures e testes de sucesso/falha. O plano detalhado das próximas entregas está em [Roadmap.md](./Roadmap.md).

## Deploy

O projeto está preparado para Vercel com `vercel.json`. Antes de um deploy de produção, configure `GEMINI_API_KEY` como variável protegida no ambiente server-side e execute os comandos de qualidade acima.
