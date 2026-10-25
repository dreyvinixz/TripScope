# TravelAI

Cliente web para explorar destinos e reunir localização, clima, dados do país, câmbio e sugestões de viagem em uma interface. Projeto da disciplina de Sistemas Distribuídos da FURG.

## Acesso ao trabalho

**Acesso público:** [https://travelai-furg.vercel.app](https://travelai-furg.vercel.app). Publicado na Vercel em 25/10/2026; confirme a página e as APIs reais antes da apresentação. O Gemini está no código, mas ainda não há `GEMINI_API_KEY` configurada no projeto Vercel; sem ela, roteiro e perguntas de IA não funcionam no deploy.

Relatório entregue pelo grupo: [Sistemas_Distribuidos_Relatorio.pdf](docs/Sistemas_Distribuidos_Relatorio.pdf). As correções identificadas para o PDF estão em [docs/report/README.md](docs/report/README.md).

## Funcionalidades

- Busca de cidades, escolha entre resultados e abertura de links de destino.
- Clima atual e previsão de cinco dias, com alternância entre °C e °F.
- Capital, população, idiomas e moeda do país.
- Conversão indicativa de BRL para a moeda local, com data da cotação.
- Histórico, favoritos e tema salvos no navegador; compartilhamento do link do destino.
- Roteiro e perguntas contextuais via Gemini, quando a função `/api/gemini` e a chave do servidor estiverem operacionais.
- Estados de carregamento e mensagens próprias para falhas parciais das APIs.

## Serviços e tratamento das respostas

| Serviço | Requisição feita pelo | Dados usados na interface |
| --- | --- | --- |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Navegador | cidade, país, código ISO, coordenadas e fuso |
| [Open-Meteo Forecast](https://open-meteo.com/en/docs) | Navegador | condições atuais e previsão para cinco dias |
| [countries.dev](https://countries.dev/docs) | Navegador | nome, bandeira, capital, população, idiomas e moedas |
| [Frankfurter](https://frankfurter.dev/) | Navegador | cotação BRL → moeda do destino e data de referência |
| Google Gemini | Função Vercel em `/api/gemini` | roteiro estruturado ou resposta a pergunta |

Os serviços em `src/services` validam os JSONs externos com Zod e convertem os dados para modelos em `src/types`. Os componentes exibem esses modelos, não os JSONs brutos. O fluxo de busca cancela requisições anteriores; clima, país e câmbio podem falhar separadamente. A cotação é informativa e pode não representar o valor de uma operação de câmbio. O Gemini recebe o contexto do destino e as preferências enviadas pelo usuário; as sugestões geradas exigem conferência.

## Demonstração

1. Abra [travelai-furg.vercel.app](https://travelai-furg.vercel.app) em uma janela anônima e pesquise `Tokyo`.
2. Escolha o resultado, se houver mais de um. Mostre clima, cinco dias, país e conversão de R$ 1.000 para JPY.
3. Altere o valor em BRL e a unidade da temperatura; salve o destino nos favoritos e recarregue a página.
4. Gere um roteiro de três dias ou pergunte o que levar na mala depois que `GEMINI_API_KEY` estiver configurada na Vercel. Mostre a resposta tratada e a opção de impressão.
5. Explique de onde vem cada dado e como o painel reage se uma API falhar. Use outro destino, como `Paris`, para uma segunda busca.

O roteiro individual e os pontos de explicação estão em [docs/presentation/README.md](docs/presentation/README.md).

## Execução local

Requisitos: Node.js 20 ou superior e npm.

```powershell
npm ci
npm run dev
```

Abra o endereço mostrado pelo Vite. Para testar o Gemini localmente, copie `.env.example` para `.env.local`, defina `GEMINI_API_KEY` e reinicie o Vite. A chave fica no servidor: nunca use o prefixo `VITE_`, nem a inclua no código ou no relatório. As quatro APIs públicas funcionam sem chave.

## Verificação

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Os testes unitários e E2E principais usam fixtures e mocks. `npm run test:contract` consulta os serviços públicos e depende de rede. Depois de publicar, execute o smoke da página online:

```powershell
$env:E2E_BASE_URL='https://URL-PUBLICA-CONFIRMADA'
npm run test:e2e -- --grep "\[public\]" --project=desktop-chromium
```

Esse smoke verifica a abertura da página; a demonstração das APIs reais e do Gemini ainda deve ser feita no endereço público. A configuração de deploy está em `vercel.json`. Consulte [docs/architecture/README.md](docs/architecture/README.md) para o fluxo de dados.
