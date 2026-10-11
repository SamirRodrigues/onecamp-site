/**
 * Mural de comentários do II Onecamp.
 * Projeto do Apps Script (avulso) que grava na planilha "OneCamp - Comentários" pelo ID.
 * Implante como Aplicativo da Web (executar como: eu; quem tem acesso: qualquer pessoa).
 *
 * Planilha (aba "Comentarios"), colunas:
 *   A data | B nome | C comentario | D cidade | E visivel
 * Para ocultar um comentário no site, troque "visivel" para FALSE.
 */
var ID_PLANILHA = '16rDZ3OSatFT2allb_12WM_r1q4WGiSuOwBshpTxSuM4';
var ABA = 'Comentarios';
var MAX_NOME = 60, MAX_TEXTO = 500, MAX_CIDADE = 80;
var LIMITE_POR_MINUTO = 20;   // proteção contra abuso (global)
var MAX_EXIBIDOS = 100;

function aba_() {
  var ss = SpreadsheetApp.openById(ID_PLANILHA);
  var sh = ss.getSheetByName(ABA) || ss.getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(['data', 'nome', 'comentario', 'cidade', 'visivel']);
  return sh;
}

function limpa_(s, max) {
  s = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  s = s.replace(/^[=+\-@]+/, function (m) { return "'" + m; }); // evita fórmulas na planilha
  return s.slice(0, max);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var dados = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var nome = limpa_(dados.nome, MAX_NOME);
    var texto = limpa_(dados.texto, MAX_TEXTO);
    var cidade = limpa_(dados.cidade, MAX_CIDADE);
    if (!nome || !texto) return saida_({ ok: false, erro: 'campos' });

    var cache = CacheService.getScriptCache();
    var chave = 'n' + Math.floor(Date.now() / 60000);
    var n = Number(cache.get(chave) || 0);
    if (n >= LIMITE_POR_MINUTO) return saida_({ ok: false, erro: 'limite' });
    cache.put(chave, String(n + 1), 120);

    aba_().appendRow([new Date(), nome, texto, cidade, true]);
    return saida_({ ok: true });
  } catch (err) {
    return saida_({ ok: false, erro: 'falha' });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() {
  var sh = aba_();
  var ult = sh.getLastRow();
  var itens = [];
  if (ult > 1) {
    var linhas = sh.getRange(2, 1, ult - 1, 5).getValues();
    for (var i = linhas.length - 1; i >= 0 && itens.length < MAX_EXIBIDOS; i--) {
      var l = linhas[i];
      if (String(l[4]).toUpperCase() === 'FALSE' || !l[1] || !l[2]) continue;
      itens.push({
        data: l[0] instanceof Date ? l[0].toISOString() : String(l[0]),
        nome: String(l[1]),
        texto: String(l[2]),
        cidade: String(l[3] || '')
      });
    }
  }
  return saida_({ comentarios: itens });
}

function saida_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
