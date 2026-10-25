# Relatório acadêmico

O relatório revisado está em [Sistemas_Distribuidos_Relatorio.pdf](../Sistemas_Distribuidos_Relatorio.pdf). O LaTeX editável está em [source/main.tex](source/main.tex), com a imagem institucional necessária em `source/Imagens/FURG.png`.

A revisão corrigiu a API de países para `countries.dev`, acrescentou o Gemini ao mapeamento dos serviços, redesenhou o fluxo real das requisições e corrigiu a formatação da conclusão. O PDF foi recompilado e inspecionado visualmente.

**URL publicada:** https://travelai-furg.vercel.app. Em 25/10/2026, a página principal respondeu HTTP 200 e a função Gemini respondeu HTTP 200 nos testes reais de pergunta contextual e geração de roteiro. O fallback `gemini-3.5-flash-lite` respondeu quando o modelo principal retornou HTTP 503. Repetir a demonstração ao vivo antes da apresentação e demonstrar também as quatro APIs públicas sem mocks.

Para recompilar a partir de `source/`, execute `pdflatex -interaction=nonstopmode -halt-on-error main.tex` duas vezes e copie o PDF resultante para `docs/Sistemas_Distribuidos_Relatorio.pdf`.
