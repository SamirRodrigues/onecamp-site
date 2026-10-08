# II Onecamp FORJADO

Site do II Onecamp de Desbravadores (29/10 a 02/11/2026), publicado em https://onecamp.com.br.

Página única em HTML/CSS/JS, sem dependências. O ranking da gincana lê uma planilha do Google Sheets publicada como CSV.

## Ranking da gincana
1. Importe `modelo-planilha-equipes.csv` no Google Sheets (colunas: equipe, pontos). O nome da equipe é o da unidade; o site liga o nome ao brasão automaticamente.
2. Arquivo > Compartilhar > Publicar na Web > formato CSV.
3. Cole o link em `SHEET_CSV_URL` no `index.html`. O site atualiza a cada 30 segundos.

Sem o link, o site mostra dados de exemplo.

## Publicação
Envie `index.html` e a pasta `img/` para a `public_html` da hospedagem (Hostinger).

## Teste local
```
python -m http.server 8765
```
Abra http://localhost:8765/index.html

Não versionar documentos de secretaria nem dados pessoais (CPF, RG, telefones).

## Unidades participantes
Os nomes e brasões ficam em `js/unidades.js` e `img/unidades/`. Para incluir uma unidade, adicione um item no arquivo e a imagem na pasta. Todas as unidades aparecem no ranking mesmo que ainda não estejam na planilha (com 0 ponto).

