# Roteiro de apresentação individual

Cada integrante deve conseguir apresentar sozinho, usando a URL pública do README.

1. **Problema e solução:** o usuário pesquisa uma cidade e recebe dados de serviços diferentes em uma página.
2. **Busca ao vivo:** pesquise `Tokyo`, escolha a cidade se aparecerem alternativas e mostre o destino na URL.
3. **APIs e regras:** Open-Meteo localiza a cidade e fornece clima; countries.dev fornece dados do país; Frankfurter fornece a cotação BRL → moeda local. Mostre a data do câmbio. Explique a validação com Zod, a conversão para modelos internos e os estados de erro independentes.
4. **Interação:** altere o valor em BRL, a unidade °C/°F e salve um favorito. Recarregue para demonstrar o armazenamento local. Pesquise `Paris` como segundo exemplo.
5. **Gemini ao vivo:** gere um roteiro de três dias e faça uma pergunta sobre a viagem. Explique que o navegador envia JSON para `/api/gemini`, onde a chave permanece protegida, e que a função valida a entrada e a resposta estruturada. Em 25/10/2026, os dois fluxos responderam HTTP 200; quando o modelo principal falhou com HTTP 503, o fallback respondeu. O conteúdo gerado deve ser conferido; não apresente uma resposta simulada como resposta real da API.
6. **Limitações:** dados externos podem falhar; o painel preserva os cartões que carregaram. O câmbio é indicativo e o roteiro não confirma preços ou horários.

Antes da apresentação, abrir a URL pública em janela anônima e repetir as buscas sem mocks. Ter uma sequência alternativa com as quatro APIs públicas caso o provedor de IA esteja indisponível, explicando essa limitação com transparência.
