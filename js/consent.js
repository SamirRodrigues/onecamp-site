/* Consentimento de cookies (LGPD) e localização aproximada do II Onecamp.
   Cookies:
     onecamp_consent  (essencial, 180 dias)  guarda as escolhas do visitante
     onecamp_cidade   (opcional, 30 dias)    cidade aproximada, só com consentimento de "localização" */
(function () {
  var KEY = 'onecamp_consent', CITY = 'onecamp_cidade', VERSION = 1, CONSENT_DAYS = 180, CITY_DAYS = 30;
  var listeners = [];

  function getCookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(n, v, days) {
    document.cookie = n + '=' + encodeURIComponent(v) + '; max-age=' + (days * 86400) + '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }
  function delCookie(n) { document.cookie = n + '=; max-age=0; path=/; SameSite=Lax'; }

  function read() {
    try { var c = JSON.parse(getCookie(KEY) || 'null'); if (c && c.v === VERSION) return c; } catch (e) {}
    return null;
  }
  function state() { var c = read(); return { decided: !!c, loc: !!(c && c.loc), maps: !!(c && c.maps) }; }

  /* Cidade aproximada (a partir do IP), só com consentimento. O resultado fica em cookie por 30 dias. */
  function getCity() {
    if (!state().loc) return Promise.resolve('');
    var cached = getCookie(CITY);
    if (cached) return Promise.resolve(cached);
    var ctl = new AbortController(); var t = setTimeout(function () { ctl.abort(); }, 6000);
    return fetch('https://ipwho.is/?fields=success,city,region_code,country_code', { signal: ctl.signal })
      .then(function (r) { return r.json(); })
      .then(function (g) {
        clearTimeout(t);
        if (!g || !g.success || !g.city) return '';
        var c = g.country_code === 'BR' && g.region_code ? g.city + '/' + g.region_code : g.city;
        if (state().loc) setCookie(CITY, c, CITY_DAYS);
        return c;
      })
      .catch(function () { clearTimeout(t); return ''; });
  }

  function save(loc, maps) {
    setCookie(KEY, JSON.stringify({ v: VERSION, loc: !!loc, maps: !!maps, t: Date.now() }), CONSENT_DAYS);
    if (!loc) delCookie(CITY);
    apply();
    listeners.forEach(function (f) { try { f(state()); } catch (e) {} });
  }

  /* Mapa do Google só é carregado com consentimento */
  function apply() {
    var slot = document.getElementById('mapa-slot'); if (!slot) return;
    var s = state();
    if (s.maps) {
      if (!slot.querySelector('iframe')) {
        slot.innerHTML = '<iframe title="Mapa da Granja Viva Mar" src="https://www.google.com/maps?q=-6.00604,-35.3059675&z=17&output=embed" style="width:100%;height:100%;border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
      }
    } else {
      slot.innerHTML = '<div class="mapa-off"><p>O mapa é fornecido pelo Google Maps, que pode usar cookies e coletar dados de navegação. Ele só é carregado com a sua autorização.</p><button type="button" class="btn ghost" id="mapa-on">Carregar o mapa</button></div>';
      var b = document.getElementById('mapa-on');
      if (b) b.addEventListener('click', function () { var c = state(); save(c.loc, true); });
    }
  }

  /* ---------- Interface ---------- */
  var css = '' +
    '#cc-bar{position:fixed;left:12px;right:12px;bottom:12px;z-index:1000;max-width:760px;margin:0 auto;background:#13264d;border:1px solid rgba(232,182,67,.5);border-radius:16px;padding:18px 20px;box-shadow:0 10px 40px rgba(0,0,0,.5);color:#f4efe3;font-size:.9rem;line-height:1.5}' +
    '#cc-bar h2{font-family:Cinzel,serif;font-size:1.05rem;color:#e8b643;margin:0 0 6px;letter-spacing:.02em}' +
    '#cc-bar p{color:#b9c0d0;margin:0 0 12px}#cc-bar a{color:#f6d98a}' +
    '.cc-btns{display:flex;gap:10px;flex-wrap:wrap}' +
    '.cc-btn{flex:1 1 140px;font:inherit;font-weight:600;font-size:.9rem;padding:11px 16px;border-radius:999px;border:1.5px solid #e8b643;background:transparent;color:#e8b643;cursor:pointer}' +
    '.cc-btn:hover{background:rgba(232,182,67,.14)}.cc-btn.pri{background:#e8b643;color:#0b1730}.cc-btn.pri:hover{background:#f6d98a}' +
    '.cc-opt{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-top:1px solid rgba(232,182,67,.25)}' +
    '.cc-opt input{margin-top:4px;width:18px;height:18px;accent-color:#e8b643;flex:none}' +
    '.cc-opt b{display:block;color:#f6d98a}.cc-opt span{color:#b9c0d0;font-size:.85rem}' +
    '#cc-panel{display:none;margin:8px 0 12px}#cc-bar.open #cc-panel{display:block}#cc-bar.open .cc-simple{display:none}' +
    '.mapa-off{height:100%;display:grid;place-content:center;gap:14px;text-align:center;padding:24px;color:#b9c0d0;font-size:.9rem}.mapa-off p{margin:0}' +
    '.foot-links{margin-top:10px}.foot-links a,.foot-links button{color:#b9c0d0;background:none;border:0;font:inherit;font-size:.82rem;text-decoration:underline;cursor:pointer;margin:0 8px}.foot-links a:hover,.foot-links button:hover{color:#f6d98a}' +
    '@media(max-width:520px){#cc-bar{left:8px;right:8px;bottom:8px;padding:14px}}';

  function buildBar() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var bar = document.createElement('div');
    bar.id = 'cc-bar'; bar.setAttribute('role', 'dialog'); bar.setAttribute('aria-label', 'Preferências de cookies'); bar.hidden = true;
    bar.innerHTML =
      '<h2>Sua privacidade</h2>' +
      '<div class="cc-simple"><p>Usamos um cookie essencial para lembrar esta escolha. Com a sua autorização, também podemos carregar o mapa do Google e identificar a sua cidade aproximada (pelo endereço IP) para o mural de comentários. ' +
      'Você pode recusar sem perder nenhum conteúdo do site. Saiba mais na <a href="privacidade.html">Política de Privacidade</a>.</p></div>' +
      '<div id="cc-panel">' +
        '<div class="cc-opt"><input type="checkbox" checked disabled aria-label="Essenciais"><label><b>Essenciais (sempre ativos)</b><span>Cookie “onecamp_consent”, por 180 dias, que guarda as suas escolhas. Não identifica você.</span></label></div>' +
        '<div class="cc-opt"><input type="checkbox" id="cc-loc"><label for="cc-loc"><b>Localização aproximada</b><span>Descobre a sua cidade pelo IP, usando o serviço ipwho.is, e guarda no cookie “onecamp_cidade” por 30 dias. Usada só se você marcar “mostrar minha cidade” ao comentar.</span></label></div>' +
        '<div class="cc-opt"><input type="checkbox" id="cc-maps"><label for="cc-maps"><b>Mapa do Google</b><span>Carrega o Google Maps na seção “Local”. O Google pode definir cookies e receber o seu IP.</span></label></div>' +
      '</div>' +
      '<div class="cc-btns">' +
        '<button type="button" class="cc-btn pri" id="cc-all">Aceitar todos</button>' +
        '<button type="button" class="cc-btn pri" id="cc-none">Recusar opcionais</button>' +
        '<button type="button" class="cc-btn" id="cc-custom">Personalizar</button>' +
      '</div>';
    document.body.appendChild(bar);

    var $ = function (id) { return document.getElementById(id); };
    $('cc-all').onclick = function () { save(true, true); bar.hidden = true; };
    $('cc-none').onclick = function () { save(false, false); bar.hidden = true; };
    $('cc-custom').onclick = function () {
      if (bar.classList.contains('open')) { save($('cc-loc').checked, $('cc-maps').checked); bar.hidden = true; bar.classList.remove('open'); $('cc-custom').textContent = 'Personalizar'; }
      else { bar.classList.add('open'); $('cc-custom').textContent = 'Salvar minhas escolhas'; }
    };
    return bar;
  }

  var bar;
  function open(panel) {
    if (!bar) bar = buildBar();
    var s = state();
    document.getElementById('cc-loc').checked = s.loc;
    document.getElementById('cc-maps').checked = s.maps;
    bar.hidden = false;
    if (panel) { bar.classList.add('open'); document.getElementById('cc-custom').textContent = 'Salvar minhas escolhas'; }
    else { bar.classList.remove('open'); document.getElementById('cc-custom').textContent = 'Personalizar'; }
  }

  window.OneCampConsent = {
    state: state,
    open: open,
    getCity: getCity,
    onChange: function (f) { listeners.push(f); }
  };

  function init() {
    apply();
    if (!state().decided) open(false);
    [].forEach.call(document.querySelectorAll('[data-cookie-prefs]'), function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); open(true); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
