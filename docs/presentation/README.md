# Roteiro de apresentação individual

Cada integrante deve conseguir apresentar sozinho, usando a URL pública do README.

1. **Problema e solução:** o usuário pesquisa uma cidade e recebe dados de serviços diferentes em uma página.
2. **Busca ao vivo:** pesquise `Tokyo`, escolha a cidade se aparecerem alternativas e mostre o destino na URL.
3. **APIs e regras:** Open-Meteo localiza a cidade e fornece clima; countries.dev fornece dados do país; Frankfurter fornece a cotação BRL → moeda local. Mostre a data do câmbio. Explique a validação com Zod, a conversão para modelos internos e os estados de erro independentes.
4. **Interação:** altere o valor em BRL, a unidade °C/°F e salve um favorito. Recarregue para demonstrar o armazenamento local. Pesquise `Paris` como segundo exemplo.
5. **Gemini, se operacional no deploy:** gere um roteiro de três dias e faça uma pergunta sobre a viagem. Explique que o navegador envia uma requisição a `/api/gemini`, onde fica a chave, e que o conteúdo gerado deve ser conferido. Não apresente uma resposta simulada como resposta real da API.
6. **Limitações:** dados externos podem falhar; o painel preserva os cartões que carregaram. O câmbio é indicativo e o roteiro não confirma preços ou horários.

Antes da apresentação, abrir a URL pública em janela anônima, repetir as buscas sem mocks e conferir que o Gemini responde se for demonstrado. Ter uma sequência alternativa com as quatro APIs públicas caso o provedor de IA esteja indisponível, explicando essa limitação com transparência.
