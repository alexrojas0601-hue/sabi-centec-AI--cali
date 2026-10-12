/*!
 * SABI EN VIVO · widget para todas las apps SABI CENTEC
 * Instalar en cualquier app, antes de </body>:
 *   <script src="https://ai.sabicentec.com/sabi-vivo.js" defer></script>
 * Opcional: data-frente="cali|colombia|mundo|educacion"  data-posicion="izquierda"
 * Muestra un botón flotante con: Hoy (clima de Cali + noticias del día) y ¿Cómo funciona? (Wikipedia).
 */
(function () {
  if (window.__sabiVivo) return; window.__sabiVivo = true;
  var API = 'https://ai.sabicentec.com/api';
  var me = document.currentScript || {};
  var frenteInicial = (me.dataset && me.dataset.frente) || 'cali';
  var izquierda = me.dataset && me.dataset.posicion === 'izquierda';

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function getJSON(url) {
    var c = new AbortController(); var t = setTimeout(function () { c.abort(); }, 12000);
    return fetch(url, { signal: c.signal }).then(function (r) { clearTimeout(t); return r.json(); });
  }

  var host = document.createElement('div');
  host.id = 'sabi-vivo';
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
  var lado = izquierda ? 'left' : 'right';
  root.innerHTML = '<style>' +
    ':host{all:initial}*{box-sizing:border-box;font-family:"Public Sans",system-ui,-apple-system,Segoe UI,Roboto,sans-serif}' +
    '.fab{position:fixed;bottom:18px;' + lado + ':18px;z-index:2147483000;display:flex;align-items:center;gap:8px;background:#1A2D7A;color:#fff;border:2px solid #F5C518;border-radius:999px;padding:10px 16px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(26,45,122,.35)}' +
    '.fab .dot{width:10px;height:10px;border-radius:50%;background:#F47C20;box-shadow:0 0 0 0 rgba(244,124,32,.7);animation:p 1.8s infinite}' +
    '@keyframes p{70%{box-shadow:0 0 0 10px rgba(244,124,32,0)}100%{box-shadow:0 0 0 0 rgba(244,124,32,0)}}' +
    '.panel{position:fixed;bottom:76px;' + lado + ':18px;z-index:2147483000;width:min(380px,calc(100vw - 32px));max-height:min(70vh,620px);display:none;flex-direction:column;background:#fff;color:#1F1D1A;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.25);overflow:hidden;border:1px solid #D8E5F8}' +
    '.panel.on{display:flex}' +
    '.head{background:#1A2D7A;color:#fff;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}' +
    '.head b{font-size:16px}.head small{color:#F5C518;font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;display:block}' +
    '.x{background:none;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1}' +
    '.tabs{display:flex;border-bottom:1px solid #E3ECF8}.tabs button{flex:1;background:none;border:0;padding:10px;font-size:14px;font-weight:700;color:#4B5A70;cursor:pointer;border-bottom:3px solid transparent}' +
    '.tabs button.on{color:#1A2D7A;border-bottom-color:#F47C20}' +
    '.body{padding:14px 16px;overflow:auto;font-size:14.5px;line-height:1.55}' +
    '.clima{background:#FFF7EF;border-left:5px solid #F47C20;border-radius:10px;padding:10px 12px;margin-bottom:12px}' +
    '.clima .t{font-size:26px;font-weight:800;color:#1A2D7A}' +
    '.chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}.chips button{border:1px solid #D8E5F8;background:#F5F8FD;color:#1A2D7A;border-radius:999px;padding:5px 11px;font-size:13px;font-weight:600;cursor:pointer}' +
    '.chips button.on{background:#1A2D7A;color:#fff;border-color:#1A2D7A}' +
    'ol{margin:0;padding-left:20px}li{margin-bottom:8px}a{color:#1A2D7A}.src{color:#4B5A70;font-size:12.5px}' +
    'form{display:flex;gap:6px;margin-bottom:12px}input{flex:1;border:1px solid #C9D6EC;border-radius:10px;padding:9px 11px;font-size:14.5px}' +
    'form button{background:#F47C20;color:#fff;border:0;border-radius:10px;padding:0 14px;font-weight:700;cursor:pointer}' +
    '.cf img{width:100%;max-height:180px;object-fit:cover;border-radius:10px;margin-bottom:8px}.cf h4{margin:0 0 6px;color:#1A2D7A;font-size:16px}' +
    '.cf .sec{background:#F2F6FD;border-radius:10px;padding:10px 12px;margin:10px 0}.muted{color:#4B5A70}.foot{border-top:1px solid #E3ECF8;padding:8px 16px;font-size:11.5px;color:#4B5A70}' +
    '</style>' +
    '<button class="fab" aria-expanded="false" aria-controls="p"><span class="dot"></span>En vivo · ¿Cómo funciona?</button>' +
    '<section class="panel" id="p" role="dialog" aria-label="SABI en vivo">' +
    '<div class="head"><div><small>SABI CENTEC</small><b>En vivo</b></div><button class="x" aria-label="Cerrar">×</button></div>' +
    '<div class="tabs"><button class="on" data-tab="hoy">Hoy</button><button data-tab="cf">¿Cómo funciona?</button></div>' +
    '<div class="body" id="b"></div>' +
    '<div class="foot">Fuentes: Open-Meteo, Google Noticias, Wikipedia (CC BY-SA). Verifica siempre la fecha y la fuente.</div>' +
    '</section>';

  var fab = root.querySelector('.fab'), panel = root.querySelector('.panel'), body = root.querySelector('#b');
  var tab = 'hoy', frente = frenteInicial, ultimoCF = '';

  function abrir(on) { panel.classList.toggle('on', on); fab.setAttribute('aria-expanded', on); if (on) pintar(); }
  fab.addEventListener('click', function () { abrir(!panel.classList.contains('on')); });
  root.querySelector('.x').addEventListener('click', function () { abrir(false); });
  root.querySelectorAll('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      root.querySelectorAll('.tabs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      tab = b.dataset.tab; pintar();
    });
  });

  function pintar() { tab === 'hoy' ? pintarHoy() : pintarCF(); }

  function pintarHoy() {
    var nombres = { cali: 'Cali', colombia: 'Colombia', mundo: 'Mundo', educacion: 'Educación' };
    body.innerHTML = '<div class="chips">' + Object.keys(nombres).map(function (k) {
      return '<button data-f="' + k + '" class="' + (k === frente ? 'on' : '') + '">' + nombres[k] + '</button>';
    }).join('') + '</div><p class="muted">Cargando lo que está pasando hoy…</p>';
    body.querySelectorAll('.chips button').forEach(function (b) { b.addEventListener('click', function () { frente = b.dataset.f; pintarHoy(); }); });
    getJSON(API + '/actualidad?clima=1&noticias=1&frente=' + frente).then(function (d) {
      var h = body.querySelector('.chips').outerHTML;
      if (d.clima) {
        var c = d.clima;
        h += '<div class="clima"><div class="src">Clima en Cali · ' + esc(d.consultado) + '</div><div class="t">' + Math.round(c.temperatura) + ' °C · ' + esc(c.estado) + '</div>' +
          'Hoy entre ' + Math.round(c.minima) + ' y ' + Math.round(c.maxima) + ' °C · ' + c.probLluvia + ' % de lluvia · UV ' + Math.round(c.uv) + '</div>';
      }
      if (d.noticias && d.noticias.length) {
        h += '<b>Noticias de hoy · ' + nombres[d.frente || frente] + '</b><ol>' + d.noticias.slice(0, 6).map(function (n) {
          return '<li><a href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(n.titulo) + '</a>' + (n.fuente ? '<div class="src">' + esc(n.fuente) + '</div>' : '') + '</li>';
        }).join('') + '</ol>';
      } else h += '<p class="muted">No pude traer noticias en este momento. Intenta de nuevo en unos minutos.</p>';
      body.innerHTML = h;
      body.querySelectorAll('.chips button').forEach(function (b) { b.addEventListener('click', function () { frente = b.dataset.f; pintarHoy(); }); });
    }).catch(function () { body.querySelector('.muted').textContent = 'Sin conexión con el servicio en vivo. Revisa tu internet.'; });
  }

  function pintarCF() {
    body.innerHTML = '<form><input placeholder="Ej: nevera, avión, impresora, máquina de vapor" value="' + esc(ultimoCF) + '" aria-label="¿Qué quieres entender?"><button>Ver</button></form><div class="cf"><p class="muted">Escribe un objeto, máquina o proceso y te explico cómo funciona.</p></div>';
    var form = body.querySelector('form'), out = body.querySelector('.cf');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = form.querySelector('input').value.trim(); if (!q) return; ultimoCF = q;
      out.innerHTML = '<p class="muted">Buscando cómo funciona…</p>';
      getJSON(API + '/comofunciona?q=' + encodeURIComponent(q)).then(function (w) {
        if (!w.ok) { out.innerHTML = '<p class="muted">No encontré una explicación para "' + esc(q) + '". Prueba con otra palabra.</p>'; return; }
        out.innerHTML = (w.imagen ? '<img src="' + esc(w.imagen) + '" alt="' + esc(w.titulo) + '">' : '') +
          '<h4>' + esc(w.titulo) + '</h4><p>' + esc(w.resumen.split('\n')[0]) + '</p>' +
          (w.funcionamiento ? '<div class="sec"><b>' + esc(w.funcionamiento.seccion) + '</b><p>' + esc(w.funcionamiento.texto).replace(/\n+/g, '</p><p>') + '</p></div>' : '') +
          '<p class="src"><a href="' + esc(w.url) + '" target="_blank" rel="noopener">Leer completo en Wikipedia</a> · <a href="' + esc(w.video) + '" target="_blank" rel="noopener">Ver animaciones</a> · ' + esc(w.licencia) + '</p>';
      }).catch(function () { out.innerHTML = '<p class="muted">Sin conexión con el servicio. Revisa tu internet.</p>'; });
    });
    form.querySelector('input').focus();
  }

  (document.body ? Promise.resolve() : new Promise(function (r) { document.addEventListener('DOMContentLoaded', r); }))
    .then(function () { document.body.appendChild(host); });
})();
