# Relatório acadêmico

O relatório revisado está em [Sistemas_Distribuidos_Relatorio.pdf](../Sistemas_Distribuidos_Relatorio.pdf). O LaTeX editável está em [source/main.tex](source/main.tex), com a imagem institucional necessária em `source/Imagens/FURG.png`.

A revisão corrigiu a API de países para `countries.dev`, acrescentou o Gemini ao mapeamento dos serviços, redesenhou o fluxo real das requisições e corrigiu a formatação da conclusão. O PDF foi recompilado e inspecionado visualmente.

**URL publicada:** https://travelai-furg.vercel.app. O acesso HTTP 200 foi verificado. A chave `GEMINI_API_KEY` ainda não está cadastrada na Vercel, então o relatório e a apresentação devem tratar a função de IA como indisponível até a configuração dessa variável. Antes da entrega, demonstrar ao vivo as quatro APIs públicas sem mocks.

Para recompilar a partir de `source/`, execute `pdflatex -interaction=nonstopmode -halt-on-error main.tex` duas vezes e copie o PDF resultante para `docs/Sistemas_Distribuidos_Relatorio.pdf`.
