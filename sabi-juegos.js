/*!
 * SABI JUEGOS · Motor de Aprendizaje Infantil de AI CENTEC
 * Ayudas didácticas jugables e imprimibles que se generan a partir de cualquier tema (infinitas):
 *   experimento (POE) · ficha (generador de matemáticas) · lectura (6 niveles) · worksheet · escape · detective
 *   boardgame · estaciones · manipulativo · lapbook · puzzle · minibook · foda · autoevaluacion
 * Requiere sabi-recursos.js (se registra en SabiRecursos). Todo texto del modelo pasa por esc().
 */
(function () {
  'use strict';
  if (!window.SabiRecursos) return;
  var U = SabiRecursos.util, esc = U.esc, el = U.el, caja = U.caja;

  // ------------------------------------------------------------------ utilidades
  function barajar(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function boton(txt, cls, fn) { var b = el('button', 'srb' + (cls ? ' ' + cls : ''), esc(txt)); b.type = 'button'; if (fn) b.onclick = fn; return b; }
  function texto(s) { return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ]+/g, ' ').trim(); }
  function numero(s) {
    var t = String(s == null ? '' : s).replace(/[$\s]/g, '').replace(/[−–]/g, '-');
    var f = t.match(/^(-?\d+)\/(\d+)$/); if (f) return Number(f[1]) / Number(f[2]);
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) t = t.replace(/\./g, '').replace(',', '.'); else t = t.replace(',', '.');
    return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  }
  function iguales(dado, esperado) {
    return String(esperado == null ? '' : esperado).split('|').some(function (e) {
      var a = numero(dado), b = numero(e);
      if (isFinite(a) && isFinite(b)) return Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 1e-4);
      return texto(dado) !== '' && texto(dado) === texto(e);
    });
  }
  var LS = { get: function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }, set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  var PRINT_CSS = 'body{font-family:"Public Sans",Arial,sans-serif;color:#111;margin:18px}h1{font-size:22px;margin:0 0 6px}h2{font-size:17px;margin:14px 0 6px}.meta{display:flex;gap:24px;margin:6px 0 14px;font-size:14px}.meta span{flex:1;border-bottom:1px solid #444;padding-bottom:2px}.idea{border:2px solid #111;border-radius:10px;padding:8px 12px;margin:8px 0}ol li{margin:10px 0}.linea{display:inline-block;min-width:160px;border-bottom:1px solid #444;height:18px}.salto{page-break-before:always}svg{max-width:100%;height:auto}table{border-collapse:collapse;width:100%}td,th{border:1px solid #444;padding:6px;font-size:13px;vertical-align:top}';
  function imprimir(titulo, html, horizontal) {
    var w = window.open('', '_blank');
    if (!w) { alert('Permite las ventanas emergentes de sabicentec.com para imprimir.'); return; }
    w.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><style>' + PRINT_CSS + (horizontal ? '@page{size:landscape;margin:8mm}' : '@page{margin:12mm}') + '</style></head><body>' + html + '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},350)}</scr' + 'ipt></body></html>');
    w.document.close();
  }
  function hablar(t) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); u.lang = 'es-CO'; u.rate = .9; speechSynthesis.speak(u); } catch (e) {} }
  function sonido(f) { try { var A = window.AudioContext || window.webkitAudioContext, c = new A(), o = c.createOscillator(), g = c.createGain(); o.frequency.value = f || 660; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.2, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .5); o.start(); o.stop(c.currentTime + .5); } catch (e) {} }
  var GRADO = function (n) { n = Number(n); return n === 0 ? 'Transición' : (isFinite(n) ? n + '°' : ''); };

  // ------------------------------------------------------------------ estilos propios
  var CSS = '' +
    '.sj-badges{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}.sj-badges span{border-radius:999px;padding:4px 10px;font-size:13px;font-weight:800;background:#EEF5FF;color:#073B7A;border:1px solid #CFE0F7}.sj-badges .riesgo{background:#FFF1E0;color:#9A4A00;border-color:#FFB25B}' +
    '.sj-paso{border:1px solid #E3ECF8;border-radius:14px;padding:12px 14px;margin:10px 0;background:#F8FBFF}.sj-paso h4{margin:0 0 6px;color:#073B7A;font-size:16px;display:flex;gap:8px;align-items:center}.sj-paso h4 b{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#FF8A00;color:#fff;font-size:14px}' +
    '.sj-paso.bloq{opacity:.45;pointer-events:none}.sj-seg{border-left:5px solid #C0392B;background:#FFF4F2;border-radius:10px;padding:8px 12px;margin:8px 0}.sj-ok{border-left:5px solid #108A4F;background:#EEF9F2;border-radius:10px;padding:10px 12px;margin:8px 0}' +
    '.sj textarea,.sj input[type=text]{width:100%;border:1.5px solid #C9D6EC;border-radius:10px;padding:9px 11px;font-size:15.5px;font-family:inherit;min-height:0;background:#fff;color:#1F1D1A}.sj textarea{min-height:70px}' +
    '.sj label.chk{display:flex;gap:8px;align-items:flex-start;margin:5px 0}.sj ul,.sj ol{margin:6px 0 6px 22px;padding:0}.sj li{margin:4px 0}' +
    '.sj-txt{font-family:Literata,Georgia,serif;font-size:clamp(17px,1.6vw,20px);line-height:1.85;background:#FFFDF6;border:1px solid #EFE6CC;border-radius:14px;padding:14px 18px;margin:0 0 14px}.sj-txt p{margin:0 0 10px;position:relative;padding-left:30px}.sj-txt p:before{content:attr(data-n);position:absolute;left:0;top:4px;width:22px;height:22px;border-radius:50%;background:#073B7A;color:#fff;font:700 12px/22px "Public Sans",sans-serif;text-align:center}' +
    '.sj-or{border-radius:6px;padding:1px 2px;transition:background .2s}.sj-txt.elegir .sj-or{cursor:pointer;background:#FFF3B0}.sj-txt.elegir .sj-or:hover{background:#FFD43B}.sj-or.bien{background:#BFEBD0!important}.sj-or.mal{background:#F8C9C2!important}.sj-txt mark{background:#DCEBFF;border-bottom:2px solid #064FAE;padding:0 2px;border-radius:3px}' +
    '.sj-sec{border:1px solid #E3ECF8;border-radius:14px;padding:12px 14px;margin:12px 0}.sj-sec>h4{margin:0 0 8px;color:#073B7A;font-size:17px}.sj-q{margin:10px 0;padding:10px 12px;background:#F8FBFF;border-radius:12px}.sj-q p{margin:0 0 6px;font-weight:700}' +
    '.sj-res{margin-top:6px;font-size:14.5px}.sj-score{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:10px}.sj-score div{border-radius:12px;padding:10px;background:#F5F8FD;text-align:center;font-weight:800;color:#073B7A}.sj-score small{display:block;font-weight:600;color:#4B5A70}' +
    '.sj-ord{display:flex;flex-direction:column;gap:6px}.sj-ord button{text-align:left;width:100%;background:#fff;color:#1F1D1A;border:1.5px solid #CFE0F7;border-radius:10px;padding:9px 12px;font-weight:600;box-shadow:none;font-size:15px}.sj-ord button b{display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:50%;background:#E3ECF8;color:#073B7A;margin-right:8px}.sj-ord button.sel b{background:#FF8A00;color:#fff}' +
    '.sj select{border:1.5px solid #C9D6EC;border-radius:10px;padding:7px 9px;font-size:15px;max-width:100%;font-family:inherit}' +
    '.sj-ficha-h{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin:0 0 10px;font-size:14px}.sj-ficha-h span{border-bottom:1.5px solid #9FBCE6;padding:4px 0;color:#4B5A70}' +
    '.sj-idea{border:2px solid #F5C518;background:#FFFBEA;border-radius:14px;padding:10px 14px;margin:0 0 12px}.sj-idea b{color:#9A6B00;text-transform:uppercase;font-size:12.5px;letter-spacing:.06em}' +
    '.sj-item{display:grid;grid-template-columns:1fr minmax(120px,32%);gap:10px;align-items:center;padding:8px 0;border-bottom:1px dashed #E3ECF8}.sj-item.ok input{border-color:#108A4F;background:#EEF9F2}.sj-item.no input{border-color:#C0392B;background:#FFF4F2}.sj-item small{grid-column:1/-1;color:#108A4F;font-weight:700}' +
    '.sj-lock{border:2px solid #CFE0F7;border-radius:16px;padding:12px 14px;margin:10px 0;display:grid;grid-template-columns:48px 1fr;gap:12px;align-items:start}.sj-lock svg{width:48px}.sj-lock.cerrado{opacity:.4}.sj-lock.abierto{border-color:#108A4F;background:#EEF9F2}.sj-lock .fila{display:flex;gap:6px;margin-top:6px}.sj-lock .fila input{flex:1}' +
    '.sj-shake{animation:sjs .35s}@keyframes sjs{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}' +
    '.sj-case{background:#FBF6EA;border:2px solid #7A5A2B;border-radius:6px;padding:14px;font-family:"Courier New",monospace;font-size:15px;line-height:1.6;color:#3D2A12}.sj-case h4{margin:0 0 6px;font-family:inherit;text-transform:uppercase;letter-spacing:.08em}.sj-pista{background:#fff;border:1px dashed #7A5A2B;border-radius:6px;padding:8px 10px;margin:6px 0}' +
    '.sj-board svg{width:100%;height:auto;max-width:720px;display:block;margin:0 auto}.sj-jug{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.sj-jug span{display:inline-flex;align-items:center;gap:6px;border:1.5px solid #CFE0F7;border-radius:999px;padding:4px 10px;font-weight:700;font-size:14px}.sj-jug span.turno{border-color:#FF8A00;background:#FFF7EF}.sj-jug i{width:14px;height:14px;border-radius:50%;display:inline-block}' +
    '.sj-dado{display:inline-grid;place-items:center;width:54px;height:54px;border-radius:12px;background:#fff;border:2.5px solid #073B7A;font-size:28px;font-weight:900;color:#073B7A;margin-right:10px;vertical-align:middle}.sj-carta{border:2px solid #073B7A;border-radius:14px;padding:12px 14px;margin:10px 0;background:#F2F6FD}' +
    '.sj-est{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}.sj-est>div{border:1px solid #E3ECF8;border-top:6px solid #064FAE;border-radius:12px;padding:10px 12px;background:#fff}.sj-est>div:nth-child(2n){border-top-color:#FF8A00}.sj-est>div:nth-child(3n){border-top-color:#108A4F}.sj-est h5{margin:0 0 4px;font-size:16px;color:#073B7A}' +
    '.sj-reloj{font-size:34px;font-weight:900;color:#073B7A;font-variant-numeric:tabular-nums}.sj-rot{overflow-x:auto}.sj-rot table{border-collapse:collapse;font-size:14px;margin-top:8px}.sj-rot td,.sj-rot th{border:1px solid #E3ECF8;padding:5px 8px;text-align:center}.sj-rot tr.act td{background:#FFF7EF;font-weight:800}' +
    '.sj-plant{overflow-x:auto;background:#fff;border:1px dashed #9FBCE6;border-radius:10px;padding:8px}' +
    '.sj-lap{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.sj-flap{border:2px dashed #4B5A70;border-radius:10px;min-height:130px;cursor:pointer;background:#fff;position:relative;overflow:hidden;perspective:600px}.sj-flap .tapa,.sj-flap .dentro{padding:12px;min-height:130px}.sj-flap .tapa{display:grid;place-items:center;text-align:center;font-weight:800;color:#073B7A;font-size:17px;background:linear-gradient(180deg,#FFFBEA,#FFF3C4)}' +
    '.sj-flap .dentro{display:none;font-size:15px;background:#F8FBFF}.sj-flap.on .tapa{display:none}.sj-flap.on .dentro{display:block}.sj-flap small{position:absolute;top:4px;right:8px;font-size:11px;color:#9A6B00;font-weight:800;text-transform:uppercase}' +
    '.sj-mem{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}.sj-mem button{min-height:96px;border-radius:12px;background:linear-gradient(135deg,#064FAE,#073B7A);color:#fff;font-size:15px;font-weight:700;padding:8px;box-shadow:none;width:100%}.sj-mem button.vis{background:#fff;color:#073B7A;border:2px solid #064FAE}.sj-mem button.ok{background:#EEF9F2;color:#108A4F;border:2px solid #108A4F}' +
    '.sj-cats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:10px}.sj-cats>div{border:2px dashed #9FBCE6;border-radius:12px;min-height:90px;padding:8px;cursor:pointer}.sj-cats h5{margin:0 0 6px;color:#073B7A}.sj-chip{display:inline-block;margin:4px;padding:6px 10px;border-radius:999px;border:1.5px solid #CFE0F7;background:#fff;cursor:pointer;font-weight:700;font-size:14px}.sj-chip.sel{border-color:#FF8A00;background:#FFF7EF}.sj-chip.ok{border-color:#108A4F;background:#EEF9F2}.sj-chip.no{border-color:#C0392B;background:#FFF4F2}' +
    '.sj-libro{display:grid;place-items:center;min-height:260px;background:#F5F8FD;border-radius:14px;padding:16px}.sj-pag{width:min(320px,90%);aspect-ratio:3/4;background:#fff;border:1px solid #CFE0F7;border-radius:6px 14px 14px 6px;box-shadow:6px 6px 0 #E3ECF8;padding:18px;display:flex;flex-direction:column;justify-content:center;text-align:center;font-family:Literata,Georgia,serif;font-size:18px;position:relative}.sj-pag small{position:absolute;bottom:8px;right:12px;font-family:"Public Sans",sans-serif;color:#4B5A70;font-size:12px}' +
    '.sj-foda{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sj-foda>div{border-radius:14px;padding:12px}.sj-foda h5{margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em;font-size:13.5px}' +
    '.sj-meter{height:14px;border-radius:7px;background:#E3ECF8;overflow:hidden;margin:6px 0}.sj-meter i{display:block;height:100%;background:linear-gradient(90deg,#FF8A00,#108A4F)}' +
    '@media(max-width:640px){.sj-item{grid-template-columns:1fr}.sj-foda{grid-template-columns:1fr}.sj-ficha-h{grid-template-columns:1fr}}';
  function estilos() { SabiRecursos.estilos(); if (document.getElementById('sj-css')) return; var s = el('style'); s.id = 'sj-css'; s.textContent = CSS; document.head.appendChild(s); }
  function caja2(tipo, titulo) { estilos(); var k = caja(tipo, titulo); k.body.classList.add('sj'); return k; }

  // ------------------------------------------------------------------ EXPERIMENTO (POE)
  var EJES = { materia_cambios: 'Materia y cambios', fuerza_movimiento: 'Fuerza y movimiento', luz_sonido_energia: 'Luz, sonido y energía', seres_vivos_cuerpo: 'Seres vivos y cuerpo humano', quimica: 'Química', tierra_universo: 'Tierra y universo' };

  // Banco central de experimentos (superacion.sabicentec.com/data/experimentos, 50+ por grado, auditado).
  // normalizar() acepta los dos formatos (ESQUEMA.md del banco y el formato POE de la IA) y devuelve uno solo.
  var BANCO = 'https://superacion.sabicentec.com/data/experimentos/grado-';
  function normalizar(e) {
    if (!e) return e;
    var x = {}; for (var k in e) x[k] = e[k];
    x.eje = String(x.eje || '').replace(/-/g, '_');
    if (x.predice == null && x.prediccion != null) x.predice = x.prediccion;
    if (x.explicacion == null && x.que_pasa != null) x.explicacion = x.que_pasa;
    if (x.pregunta == null && x.gancho != null) x.pregunta = x.gancho;
    if (x.duracion_min == null && x.minutos != null) x.duracion_min = x.minutos;
    if (typeof x.seguridad === 'string') x.seguridad = x.seguridad ? [x.seguridad] : [];
    if (x.riesgo == null && typeof x.adulto === 'boolean') x.riesgo = x.adulto ? 'con_adulto' : 'bajo';
    return x;
  }
  var cacheBanco = {};
  function cargarExperimentos(g) {
    g = Math.max(0, Math.min(11, parseInt(g, 10) || 0));
    if (cacheBanco[g]) return cacheBanco[g];
    cacheBanco[g] = fetch(BANCO + (g < 10 ? '0' : '') + g + '.json').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { return (Array.isArray(d) ? d : (d.experimentos || [])).map(normalizar); })
      .catch(function (e) { delete cacheBanco[g]; throw e; });
    return cacheBanco[g];
  }
  function experimento(d) {
    d = normalizar(d);
    var k = caja2('experimento', d.titulo), b = k.body, clave = 'sabi_exp_' + (d.id || texto(d.titulo).slice(0, 40));
    var guardado = LS.get(clave, {});
    b.innerHTML = '<div class="sj-badges">' + (d.grado != null && d.grado !== '' ? '<span>' + esc(GRADO(d.grado)) + '</span>' : '') + (EJES[d.eje] ? '<span>' + esc(EJES[d.eje]) + '</span>' : '') +
      (d.duracion_min ? '<span>' + esc(d.duracion_min) + ' min</span>' : '') + (d.riesgo === 'con_adulto' ? '<span class="riesgo">Con acompañamiento de un adulto</span>' : '') + '</div>' +
      (d.pregunta ? '<p style="font-size:18px;font-family:Literata,Georgia,serif"><strong>Pregunta:</strong> ' + esc(d.pregunta) + '</p>' : '') +
      (d.dba ? '<p class="sr-note"><strong>Referente MEN:</strong> ' + esc(d.dba) + '</p>' : '') +
      '<div class="sj-paso"><h4><b>0</b>Prepara</h4><p><strong>Materiales:</strong></p>' + (d.materiales || []).map(function (m) { return '<label class="chk"><input type="checkbox"> ' + esc(m) + '</label>'; }).join('') +
      ((d.seguridad || []).length ? '<div class="sj-seg"><strong>Seguridad:</strong><ul>' + d.seguridad.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' : '') + '</div>' +
      '<div class="sj-paso"><h4><b>1</b>Predice antes de hacer</h4><p>' + esc(d.predice || '¿Qué crees que va a pasar? ¿Por qué?') + '</p><textarea data-c="pred" placeholder="Escribe o dibuja tu predicción. No hay respuestas malas: los científicos también se equivocan."></textarea><div class="fila"></div></div>' +
      '<div class="sj-paso bloq" data-p="hacer"><h4><b>2</b>Hazlo y observa</h4><ol>' + (d.pasos || []).map(function (p) { return '<li><label class="chk"><input type="checkbox"> <span>' + esc(p) + '</span></label></li>'; }).join('') + '</ol>' +
      (d.observa ? '<p><strong>Observa y registra:</strong> ' + esc(d.observa) + '</p>' : '') + '<textarea data-c="obs" placeholder="¿Qué pasó? Anota lo que viste, mediste o contaste."></textarea></div>' +
      '<div class="sj-paso bloq" data-p="explica"><h4><b>3</b>Explica</h4><p>Compara lo que predijiste con lo que pasó. ¿Acertaste? ¿Qué te sorprendió?</p><div class="exp" hidden><div class="sj-ok"><strong>¿Por qué pasa?</strong> ' + esc(d.explicacion || '') + '</div>' +
      (d.vida_real ? '<p><strong>En la vida real:</strong> ' + esc(d.vida_real) + '</p>' : '') + (d.reto ? '<p><strong>Reto: cambia una variable.</strong> ' + esc(d.reto) + '</p>' : '') +
      ((d.preguntas || []).length ? '<p><strong>Preguntas para pensar:</strong></p><ol>' + d.preguntas.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' : '') +
      ((d.vocabulario || []).length ? '<div class="sr-chips">' + d.vocabulario.map(function (v) { return '<span>' + esc(v) + '</span>'; }).join('') + '</div>' : '') + '</div></div>';
    var pred = b.querySelector('[data-c=pred]'), obs = b.querySelector('[data-c=obs]'), hacer = b.querySelector('[data-p=hacer]'), explica = b.querySelector('[data-p=explica]');
    pred.value = guardado.pred || ''; obs.value = guardado.obs || '';
    var abrir = function () { hacer.classList.remove('bloq'); };
    var listo = boton('Guardé mi predicción', '', function () { if (!pred.value.trim()) { pred.focus(); pred.placeholder = 'Primero escribe tu predicción: pensar antes de mirar hace que aprendas más.'; return; } abrir(); LS.set(clave, { pred: pred.value, obs: obs.value }); hacer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
    b.querySelector('.fila').appendChild(listo);
    var verExp = boton('Ver la explicación', 'nar', function () { explica.classList.remove('bloq'); explica.querySelector('.exp').hidden = false; LS.set(clave, { pred: pred.value, obs: obs.value }); verExp.remove(); });
    hacer.appendChild(verExp);
    if (guardado.pred) abrir();
    if (guardado.obs) explica.classList.remove('bloq');
    obs.addEventListener('input', function () { if (obs.value.trim().length > 3) explica.classList.remove('bloq'); });
    var acc = el('div'); acc.style.marginTop = '8px';
    acc.appendChild(boton('Escuchar los pasos', 'alt', function () { hablar((d.titulo || '') + '. ' + (d.predice || '') + ' ' + (d.pasos || []).join('. ')); }));
    acc.appendChild(boton('Imprimir guía', 'alt', function () {
      imprimir(d.titulo, '<h1>' + esc(d.titulo) + '</h1><div class="meta"><span>Nombre:</span><span>Fecha:</span><span>Grado: ' + esc(GRADO(d.grado)) + '</span></div>' +
        '<p><b>Pregunta:</b> ' + esc(d.pregunta || '') + '</p><h2>Materiales</h2><ul>' + (d.materiales || []).map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
        ((d.seguridad || []).length ? '<div class="idea"><b>Seguridad:</b> ' + d.seguridad.map(esc).join(' · ') + '</div>' : '') +
        '<h2>1. Predigo</h2><p>' + esc(d.predice || '') + '</p><p class="linea" style="width:100%;height:60px"></p><h2>2. Hago y observo</h2><ol>' + (d.pasos || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol><p>' + esc(d.observa || '') + '</p><p class="linea" style="width:100%;height:90px"></p>' +
        '<h2>3. Explico</h2><p class="linea" style="width:100%;height:70px"></p><p><b>Reto:</b> ' + esc(d.reto || '') + '</p>' +
        '<div class="salto"><h2>Para el docente</h2><p><b>Explicación:</b> ' + esc(d.explicacion || '') + '</p><p><b>Vida real:</b> ' + esc(d.vida_real || '') + '</p><p><b>Referente:</b> ' + esc(d.dba || '') + '</p></div>');
    }));
    b.appendChild(acc);
    return k.box;
  }

  // ------------------------------------------------------------------ FICHA (generador infinito de matemáticas)
  var fichasListas = null;
  function cargarFichas() {
    if (window.SabiFichas) return Promise.resolve(window.SabiFichas);
    if (fichasListas) return fichasListas;
    fichasListas = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/sabi-fichas.js'; s.onload = function () { window.SabiFichas ? ok(window.SabiFichas) : no(); }; s.onerror = no; document.head.appendChild(s); });
    return fichasListas;
  }
  function ficha(d) {
    var tipos = { calculo: 'Cálculo a medida', problemas: 'Problemas cotidianos', series: 'Series y patrones', geometria: 'Geometría visual', dinero: 'Dinero y cambio', error: 'Encuentra el error' };
    var tipo = tipos[d.tipo_ficha] ? d.tipo_ficha : 'calculo', g = Math.max(0, Math.min(11, parseInt(d.grado, 10) || 0));
    var k = caja2('ficha', 'Ficha de ' + tipos[tipo] + ' · ' + GRADO(g)), zona = el('div', '', '<p class="sr-note">Preparando tu ficha…</p>');
    k.body.appendChild(zona);
    cargarFichas().then(function (F) { zona.innerHTML = ''; F.montar(zona, { grado: g, tipo: tipo, cantidad: Math.max(6, Math.min(20, parseInt(d.cantidad, 10) || 10)) }); })
      .catch(function () { zona.innerHTML = '<p class="sr-note">No se pudo cargar el generador. <a href="/fichas.html?g=' + g + '&t=' + tipo + '" target="_blank" rel="noopener">Ábrelo aquí</a>.</p>'; });
    k.body.appendChild(el('p', 'sr-note', 'Cada ficha es nueva: usa "Otra ficha" para practicar sin fin. <a href="/fichas.html?g=' + g + '&t=' + tipo + '" target="_blank" rel="noopener">Abrir en el generador de fichas</a>.'));
    return k.box;
  }

  // ------------------------------------------------------------------ LECTURA (6 niveles)
  function oraciones(p) { return String(p).match(/[^.!?…]+(?:[.!?…]+["”»')]*|$)/g) || [p]; }
  function lectura(d) {
    var parrafos = (Array.isArray(d.texto) ? d.texto : String(d.texto || '').split(/\n{2,}/)).map(function (x) { return String(x).trim(); }).filter(Boolean);
    var k = caja2('lectura', d.titulo || 'Lectura'), b = k.body, puntos = {};
    var palabras = (d.vocabulario || []).map(function (v) { return v.palabra; }).filter(Boolean);
    var txt = el('div', 'sj-txt'), idx = 0, todas = [];
    parrafos.forEach(function (p, i) {
      var pe = el('p'); pe.setAttribute('data-n', i + 1);
      oraciones(p).forEach(function (o) {
        if (!o.trim()) return;
        var h = esc(o);
        palabras.forEach(function (w) { var we = esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); if (we) h = h.replace(new RegExp('(^|[^\\wáéíóúñü])(' + we + ')(?=[^\\wáéíóúñü]|$)', 'i'), '$1<mark>$2</mark>'); });
        var s = el('span', 'sj-or', h + ' '); s.dataset.i = idx++; s.dataset.t = texto(o); pe.appendChild(s); todas.push(s);
      });
      txt.appendChild(pe);
    });
    var completo = texto(parrafos.join(' '));
    var cab = el('div'); cab.style.marginBottom = '8px';
    cab.appendChild(boton('Escuchar la lectura', 'alt', function () { hablar(parrafos.join(' ')); }));
    b.appendChild(el('p', 'sr-note', '<strong>Leer es comprender, relacionar y pensar.</strong> Lee con calma; luego responde por niveles.'));
    b.appendChild(cab); b.appendChild(txt);
    var marcador = function (nivel, total) { puntos[nivel] = puntos[nivel] || { ok: 0, total: total, hechas: {} }; return puntos[nivel]; };
    var anotar = function (nivel, id, bien) { var p = puntos[nivel]; if (p.hechas[id] != null) return; p.hechas[id] = bien; if (bien) p.ok++; pintarScore(); };
    var sec = function (n, t, sub) { var s = el('div', 'sj-sec', '<h4>' + n + '. ' + esc(t) + '</h4>' + (sub ? '<p class="sr-note">' + esc(sub) + '</p>' : '')); b.appendChild(s); return s; };
    var opciones = function (cont, q, nivel, id) {
      var orden = barajar((q.opciones || []).map(function (o, j) { return { o: o, j: j }; }));
      orden.forEach(function (x) {
        var bt = el('button', 'sr-op', esc(x.o)); bt.type = 'button';
        bt.onclick = function () { if (cont.dataset.ok) return; cont.dataset.ok = 1; var bien = x.j === Number(q.correcta); bt.classList.add(bien ? 'ok' : 'no'); if (!bien) cont.querySelectorAll('.sr-op').forEach(function (z, zi) { if (orden[zi].j === Number(q.correcta)) z.classList.add('ok'); }); cont.appendChild(el('div', 'sr-exp', '<strong>' + (bien ? 'Muy bien.' : 'Revisa la pista.') + '</strong> ' + esc(q.explicacion || ''))); anotar(nivel, id, bien); };
        cont.appendChild(bt);
      });
    };
    // 1 · Lo que dice el texto (literal con evidencia exacta)
    var lit = d.literal || [];
    if (lit.length) {
      var s1 = sec(1, 'Lo que dice el texto', 'Responde y luego toca en el texto la oración exacta que lo dice.'); marcador('literal', lit.length);
      lit.forEach(function (q, i) {
        var ev = texto(q.evidencia), verificable = ev.length > 3 && completo.indexOf(ev.slice(0, Math.min(ev.length, 60))) >= 0;
        var c = el('div', 'sj-q', '<p>' + (i + 1) + '. ' + esc(q.pregunta) + '</p><input type="text" placeholder="Tu respuesta">');
        var r = el('div', 'sj-res');
        if (verificable) {
          c.appendChild(boton('Encontrar en el texto', 'alt', function () {
            todas.forEach(function (s) { s.classList.remove('bien', 'mal'); }); txt.classList.add('elegir'); txt.scrollIntoView({ behavior: 'smooth', block: 'center' });
            txt.onclick = function (e) {
              var s = e.target.closest('.sj-or'); if (!s) return;
              var t = s.dataset.t, bien = t && (ev.indexOf(t) >= 0 || t.indexOf(ev) >= 0 || (ev.length > 25 && t.indexOf(ev.slice(0, 25)) >= 0));
              s.classList.add(bien ? 'bien' : 'mal');
              if (bien) { txt.classList.remove('elegir'); txt.onclick = null; r.innerHTML = '<div class="sj-ok"><strong>¡Esa es la evidencia!</strong> Respuesta: ' + esc(q.respuesta) + '</div>'; anotar('literal', i, true); c.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
              else r.innerHTML = '<span class="sr-note">Esa oración no lo dice. Vuelve a leer y busca otra.</span>';
            };
          }));
        } else {
          c.appendChild(boton('Ver respuesta', 'alt', function () { r.innerHTML = '<div class="sj-ok">Respuesta: ' + esc(q.respuesta) + '</div>'; anotar('literal', i, iguales(c.querySelector('input').value, q.respuesta)); }));
        }
        c.appendChild(r); s1.appendChild(c);
      });
    }
    // 2 · Leer entre líneas
    var inf = d.inferencial || [];
    if (inf.length) { var s2 = sec(2, 'Leer entre líneas', 'La respuesta no está escrita: se deduce con las pistas del texto.'); marcador('inferencial', inf.length); inf.forEach(function (q, i) { var c = el('div', 'sj-q', '<p>' + (i + 1) + '. ' + esc(q.pregunta) + '</p>'); opciones(c, q, 'inferencial', i); s2.appendChild(c); }); }
    // 3 · Palabras en contexto
    var voc = d.vocabulario || [];
    if (voc.length) { var s3 = sec(3, 'Palabras en contexto', 'Las palabras marcadas en azul cambian de significado según la oración.'); marcador('vocabulario', voc.length); voc.forEach(function (q, i) { var c = el('div', 'sj-q', '<p>' + (i + 1) + '. En el texto, ¿qué significa «' + esc(q.palabra) + '»?</p>'); opciones(c, q, 'vocabulario', i); s3.appendChild(c); }); }
    // 4 · ¿Dónde lo pone?
    var don = d.donde || [];
    if (don.length) {
      var s4 = sec(4, '¿Dónde lo pone?', 'Ubica el párrafo donde está la información.'); marcador('donde', don.length);
      don.forEach(function (q, i) {
        var c = el('div', 'sj-q', '<p>' + (i + 1) + '. ' + esc(q.pregunta) + '</p>'), f = el('div');
        parrafos.forEach(function (_, pi) { f.appendChild(boton('Párrafo ' + (pi + 1), 'alt', function (e) { if (c.dataset.ok) return; c.dataset.ok = 1; var bien = pi + 1 === Number(q.parrafo); e.target.style.background = bien ? '#EEF9F2' : '#FFF4F2'; c.appendChild(el('div', 'sj-res', bien ? '<strong>Exacto.</strong>' : 'Era el párrafo ' + esc(q.parrafo) + '. Vuelve a leerlo.')); anotar('donde', i, bien); })); });
        c.appendChild(f); s4.appendChild(c);
      });
    }
    // 5 · Orden y causas
    var ord = (d.orden && d.orden.eventos) || [], cau = d.causas || [];
    if (ord.length || cau.length) {
      var s5 = sec(5, 'Orden y causas');
      if (ord.length > 1) {
        marcador('orden', 1);
        var lista = el('div', 'sj-ord'), elegido = [], mezcla = barajar(ord.map(function (e, j) { return { e: e, j: j }; }));
        s5.appendChild(el('p', '', esc((d.orden && d.orden.instruccion) || 'Toca los hechos en el orden en que ocurren.')));
        var pintarOrd = function () { lista.innerHTML = ''; mezcla.forEach(function (x) { var pos = elegido.indexOf(x.j), bt = el('button', pos >= 0 ? 'sel' : '', '<b>' + (pos >= 0 ? pos + 1 : '·') + '</b>' + esc(x.e)); bt.type = 'button'; bt.onclick = function () { if (s5.dataset.fin) return; var p = elegido.indexOf(x.j); if (p >= 0) elegido.splice(p, 1); else elegido.push(x.j); pintarOrd(); }; lista.appendChild(bt); }); };
        pintarOrd(); s5.appendChild(lista);
        var ro = el('div', 'sj-res');
        s5.appendChild(boton('Comprobar el orden', '', function () { if (elegido.length < ord.length) { ro.textContent = 'Ordena todos los hechos primero.'; return; } var bien = elegido.every(function (j, n) { return j === n; }); s5.dataset.fin = 1; ro.innerHTML = bien ? '<div class="sj-ok"><strong>¡Orden perfecto!</strong></div>' : 'El orden correcto es: ' + ord.map(function (e, n) { return (n + 1) + '. ' + esc(e); }).join(' · '); anotar('orden', 0, bien); }));
        s5.appendChild(ro);
      }
      if (cau.length) {
        marcador('causas', cau.length);
        s5.appendChild(el('p', '', '<strong>Une cada causa con su efecto.</strong>'));
        var efectos = barajar(cau.map(function (c, j) { return { e: c.efecto, j: j }; }));
        cau.forEach(function (c, i) {
          var fila = el('div', 'sj-q', '<p>Causa: ' + esc(c.causa) + '</p>'), sel = el('select');
          sel.innerHTML = '<option value="">Elige el efecto…</option>' + efectos.map(function (x) { return '<option value="' + x.j + '">' + esc(x.e) + '</option>'; }).join('');
          var rr = el('div', 'sj-res');
          sel.onchange = function () { if (fila.dataset.ok || sel.value === '') return; fila.dataset.ok = 1; var bien = Number(sel.value) === i; rr.innerHTML = bien ? '<strong>Correcto.</strong>' : 'El efecto es: ' + esc(c.efecto); anotar('causas', i, bien); sel.disabled = true; };
          fila.appendChild(sel); fila.appendChild(rr); s5.appendChild(fila);
        });
      }
    }
    // 6 · Piensa y argumenta
    var arg = d.argumenta || [];
    if (arg.length) {
      var s6 = sec(6, 'Piensa y argumenta', 'Da tu opinión y sostenla con al menos una razón y una parte del texto.');
      arg.forEach(function (q, i) {
        var c = el('div', 'sj-q', '<p>' + (i + 1) + '. ' + esc(q.pregunta) + '</p><textarea placeholder="Yo pienso que… porque… En el texto dice…"></textarea>' +
          ((q.criterios || []).length ? '<p class="sr-note" style="margin-top:6px">Revisa tu respuesta:</p>' + q.criterios.map(function (cr) { return '<label class="chk"><input type="checkbox"> ' + esc(cr) + '</label>'; }).join('') : ''));
        c.appendChild(boton('Pedir retroalimentación a SABI', 'alt', function () { var t = c.querySelector('textarea').value.trim(); if (!t) { c.querySelector('textarea').focus(); return; } document.dispatchEvent(new CustomEvent('sabi:preguntar', { detail: { comando: 'critique', texto: 'Pregunta de lectura: ' + q.pregunta + '\nMi respuesta: ' + t } })); }));
        s6.appendChild(c);
      });
    }
    var score = el('div', 'sj-score'); b.appendChild(el('h4', '', 'Mi progreso de lectura')); b.appendChild(score);
    var NOM = { literal: 'Lo que dice el texto', inferencial: 'Entre líneas', vocabulario: 'Palabras en contexto', donde: '¿Dónde lo pone?', orden: 'Orden', causas: 'Causas' };
    function pintarScore() { score.innerHTML = Object.keys(puntos).map(function (n) { return '<div>' + puntos[n].ok + ' / ' + puntos[n].total + '<small>' + NOM[n] + '</small></div>'; }).join(''); }
    pintarScore();
    b.appendChild(boton('Imprimir lectura', 'alt', function () {
      var h = '<h1>' + esc(d.titulo || 'Lectura') + '</h1><div class="meta"><span>Nombre:</span><span>Fecha:</span><span>Grado: ' + esc(GRADO(d.grado)) + '</span></div>' + parrafos.map(function (p, i) { return '<p><b>' + (i + 1) + '.</b> ' + esc(p) + '</p>'; }).join('');
      h += '<h2>1. Lo que dice el texto</h2><ol>' + lit.map(function (q) { return '<li>' + esc(q.pregunta) + '<br><span class="linea" style="width:90%"></span></li>'; }).join('') + '</ol>';
      h += '<h2>2. Leer entre líneas</h2><ol>' + inf.map(function (q) { return '<li>' + esc(q.pregunta) + '<br>' + (q.opciones || []).map(function (o, j) { return '( ) ' + esc(o); }).join('<br>') + '</li>'; }).join('') + '</ol>';
      h += '<h2>3. Palabras en contexto</h2><ol>' + voc.map(function (q) { return '<li>«' + esc(q.palabra) + '»: ' + (q.opciones || []).map(function (o) { return '( ) ' + esc(o); }).join('  ') + '</li>'; }).join('') + '</ol>';
      h += '<h2>4. ¿Dónde lo pone?</h2><ol>' + don.map(function (q) { return '<li>' + esc(q.pregunta) + ' Párrafo: ____</li>'; }).join('') + '</ol>';
      h += '<h2>5. Orden y causas</h2><ol>' + barajar(ord).map(function (e) { return '<li>____ ' + esc(e) + '</li>'; }).join('') + '</ol>' + cau.map(function (c) { return '<p>Causa: ' + esc(c.causa) + ' → Efecto: <span class="linea" style="width:50%"></span></p>'; }).join('');
      h += '<h2>6. Piensa y argumenta</h2><ol>' + arg.map(function (q) { return '<li>' + esc(q.pregunta) + '<br><span class="linea" style="width:95%;height:70px"></span></li>'; }).join('') + '</ol>';
      h += '<div class="salto"><h2>Clave para el docente</h2><ol>' + lit.map(function (q) { return '<li>' + esc(q.respuesta) + ' — «' + esc(q.evidencia) + '»</li>'; }).join('') + '</ol><p>Entre líneas: ' + inf.map(function (q) { return esc((q.opciones || [])[q.correcta]); }).join(' · ') + '</p><p>Vocabulario: ' + voc.map(function (q) { return esc(q.palabra) + ' = ' + esc((q.opciones || [])[q.correcta]); }).join(' · ') + '</p><p>Párrafos: ' + don.map(function (q) { return esc(q.parrafo); }).join(', ') + '</p><p>Orden: ' + ord.map(esc).join(' → ') + '</p></div>';
      imprimir(d.titulo || 'Lectura', h);
    }));
    return k.box;
  }

  // ------------------------------------------------------------------ WORKSHEET
  function worksheet(d) {
    var k = caja2('worksheet', d.titulo), b = k.body, items = [];
    b.appendChild(el('div', 'sj-ficha-h', '<span>Nombre:</span><span>Fecha:</span><span>Grado: ' + esc(GRADO(d.grado)) + '</span>'));
    if (d.idea) b.appendChild(el('div', 'sj-idea', '<b>' + esc(d.idea.titulo || 'Idea clave') + '</b><p>' + esc(d.idea.texto || '') + '</p>' + (d.idea.ejemplo ? '<p><strong>Ejemplo:</strong> ' + esc(d.idea.ejemplo) + '</p>' : '')));
    var n = 0;
    (d.secciones || []).forEach(function (s) {
      b.appendChild(el('h4', '', esc(s.titulo || ''))); if (s.instruccion) b.appendChild(el('p', 'sr-note', esc(s.instruccion)));
      (s.items || []).forEach(function (it) { n++; var f = el('div', 'sj-item', '<span><b>' + n + '.</b> ' + esc(it.enunciado) + '</span><input type="text" aria-label="Respuesta ' + n + '">'); items.push({ f: f, r: it.respuesta }); b.appendChild(f); });
    });
    var res = el('p', 'sr-note');
    b.appendChild(boton('Revisar mis respuestas', '', function () { var ok = 0; items.forEach(function (x) { var bien = iguales(x.f.querySelector('input').value, x.r); x.f.classList.toggle('ok', bien); x.f.classList.toggle('no', !bien); if (bien) ok++; }); res.innerHTML = '<strong>' + ok + ' de ' + items.length + '</strong> correctas. ' + (ok === items.length ? '¡Excelente!' : 'Revisa las marcadas en rojo y vuelve a intentarlo.'); }));
    b.appendChild(boton('Ver respuestas', 'alt', function () { items.forEach(function (x) { if (!x.f.querySelector('small')) x.f.appendChild(el('small', '', 'Respuesta: ' + esc(x.r))); }); }));
    b.appendChild(boton('Imprimir', 'alt', function () {
      var m = 0, h = '<h1>' + esc(d.titulo) + '</h1><div class="meta"><span>Nombre:</span><span>Fecha:</span><span>Grado: ' + esc(GRADO(d.grado)) + '</span></div>' + (d.idea ? '<div class="idea"><b>' + esc(d.idea.titulo || 'Idea clave') + ':</b> ' + esc(d.idea.texto || '') + (d.idea.ejemplo ? '<br><b>Ejemplo:</b> ' + esc(d.idea.ejemplo) : '') + '</div>' : '');
      (d.secciones || []).forEach(function (s) { h += '<h2>' + esc(s.titulo || '') + '</h2><p>' + esc(s.instruccion || '') + '</p><ol start="' + (m + 1) + '">' + (s.items || []).map(function (it) { m++; return '<li>' + esc(it.enunciado) + ' <span class="linea"></span></li>'; }).join('') + '</ol>'; });
      h += '<div class="salto"><h2>Clave de respuestas</h2><ol>' + items.map(function (x) { return '<li>' + esc(x.r) + '</li>'; }).join('') + '</ol></div>';
      imprimir(d.titulo, h);
    }));
    b.appendChild(res);
    return k.box;
  }

  // ------------------------------------------------------------------ ESCAPE ROOM
  var CANDADO = '<svg viewBox="0 0 48 56" aria-hidden="true"><path d="M12 24v-8a12 12 0 0 1 24 0v8" fill="none" stroke="currentColor" stroke-width="5"/><rect x="5" y="24" width="38" height="29" rx="6" fill="currentColor"/><circle cx="24" cy="37" r="4" fill="#fff"/><rect x="22" y="38" width="4" height="8" rx="2" fill="#fff"/></svg>';
  var ABIERTO = '<svg viewBox="0 0 48 56" aria-hidden="true"><path d="M12 24v-8a12 12 0 0 1 23-4" fill="none" stroke="#108A4F" stroke-width="5"/><rect x="5" y="24" width="38" height="29" rx="6" fill="#108A4F"/><path d="M15 39l6 6 12-12" stroke="#fff" stroke-width="4" fill="none"/></svg>';
  function escape(d) {
    var k = caja2('escape', d.titulo || 'Escape room'), b = k.body, retos = d.retos || [], actual = 0, pistas = 0, ini = Date.now(), reloj = el('span', 'sj-reloj', '00:00'), tm;
    b.appendChild(el('div', 'sj-case', '<h4>Misión</h4>' + esc(d.historia || 'Resuelve cada reto para abrir el siguiente candado.')));
    var top = el('p', '', ''); top.appendChild(document.createTextNode('Tiempo: ')); top.appendChild(reloj); b.appendChild(top);
    tm = setInterval(function () { if (!document.body.contains(b)) return clearInterval(tm); var s = Math.floor((Date.now() - ini) / 1000); reloj.textContent = ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + s % 60).slice(-2); }, 1000);
    var cont = el('div'); b.appendChild(cont);
    function pintar() {
      cont.innerHTML = '';
      retos.forEach(function (r, i) {
        var estado = i < actual ? 'abierto' : i === actual ? '' : 'cerrado';
        var c = el('div', 'sj-lock ' + estado, '<div style="color:#073B7A">' + (i < actual ? ABIERTO : CANDADO) + '</div><div><strong>' + esc(r.titulo || 'Candado ' + (i + 1)) + '</strong>' + (i <= actual ? '<p>' + esc(r.enunciado) + '</p>' : '<p class="sr-note">Bloqueado: abre el anterior.</p>') + (i < actual ? '<p class="sr-note">Clave: ' + esc(r.respuesta) + '</p>' : '') + '</div>');
        if (i === actual) {
          var fila = el('div', 'fila'), inp = el('input'); inp.type = 'text'; inp.placeholder = 'Clave'; inp.setAttribute('aria-label', 'Clave del candado');
          var probar = function () { if (iguales(inp.value, r.respuesta)) { sonido(880); actual++; pintar(); } else { c.classList.remove('sj-shake'); void c.offsetWidth; c.classList.add('sj-shake'); sonido(220); } };
          inp.onkeydown = function (e) { if (e.key === 'Enter') probar(); };
          fila.appendChild(inp); fila.appendChild(boton('Abrir', '', probar));
          if (r.pista) fila.appendChild(boton('Pista', 'alt', function (e) { pistas++; e.target.replaceWith(el('span', 'sr-note', 'Pista: ' + esc(r.pista))); }));
          c.lastChild.appendChild(fila);
        }
        cont.appendChild(c);
      });
      if (actual >= retos.length && retos.length) { clearInterval(tm); cont.appendChild(el('div', 'sj-ok', '<strong>¡Escaparon!</strong> Tiempo: ' + reloj.textContent + ' · pistas usadas: ' + pistas + '. ' + esc(d.final || ''))); sonido(1046); }
    }
    pintar();
    b.appendChild(boton('Imprimir para el aula', 'alt', function () { imprimir(d.titulo, '<h1>' + esc(d.titulo) + '</h1><div class="idea">' + esc(d.historia || '') + '</div>' + retos.map(function (r, i) { return '<h2>' + esc(r.titulo || 'Candado ' + (i + 1)) + '</h2><p>' + esc(r.enunciado) + '</p><p>Clave: <span class="linea"></span></p>'; }).join('') + '<div class="salto"><h2>Claves (docente)</h2><ol>' + retos.map(function (r) { return '<li>' + esc(r.respuesta) + (r.pista ? ' — pista: ' + esc(r.pista) : '') + '</li>'; }).join('') + '</ol></div>'); }));
    return k.box;
  }

  // ------------------------------------------------------------------ DETECTIVE
  function detective(d) {
    var k = caja2('detective', d.titulo || 'Caso detective'), b = k.body, pistas = d.pistas || [], vistas = 0;
    b.appendChild(el('div', 'sj-case', '<h4>Expediente</h4>' + esc(d.caso || '')));
    var zona = el('div'), ver = boton('Revelar pista 1 de ' + pistas.length, 'nar', function () { if (vistas >= pistas.length) return; zona.appendChild(el('div', 'sj-pista', '<strong>Pista ' + (vistas + 1) + ':</strong> ' + esc(pistas[vistas]))); vistas++; ver.textContent = vistas < pistas.length ? 'Revelar pista ' + (vistas + 1) + ' de ' + pistas.length : 'No hay más pistas'; });
    b.appendChild(zona); b.appendChild(ver);
    var q = el('div', 'sj-q', '<p>' + esc(d.pregunta || '¿Cuál es la solución del caso?') + '</p>');
    (d.opciones || []).forEach(function (o, j) {
      var bt = el('button', 'sr-op', esc(o)); bt.type = 'button';
      bt.onclick = function () { if (q.dataset.ok) return; var bien = j === Number(d.correcta); bt.classList.add(bien ? 'ok' : 'no'); if (bien) { q.dataset.ok = 1; var est = Math.max(1, 3 - Math.floor(vistas / Math.max(1, Math.ceil(pistas.length / 3)))); q.appendChild(el('div', 'sj-ok', '<strong>¡Caso resuelto! ' + '★★★'.slice(0, est) + '☆☆☆'.slice(0, 3 - est) + '</strong> (usaste ' + vistas + ' pista' + (vistas === 1 ? '' : 's') + '). ' + esc(d.explicacion || ''))); sonido(880); } else { q.appendChild(el('div', 'sj-res', 'No cuadra con la evidencia. Revisa las pistas y vuelve a intentarlo.')); } };
      q.appendChild(bt);
    });
    b.appendChild(q);
    return k.box;
  }

  // ------------------------------------------------------------------ JUEGO DE MESA
  var COLORES = ['#064FAE', '#FF8A00', '#108A4F', '#7A5AC8'];
  function boardgame(d) {
    var N = Math.max(12, Math.min(40, parseInt(d.casillas, 10) || 24)), k = caja2('boardgame', d.titulo || 'Juego de mesa'), b = k.body;
    var preguntas = (d.preguntas || []).filter(function (p) { return p && p.pregunta; }), mazo = barajar(preguntas), carta = 0;
    var esp = {}; (d.especiales || []).forEach(function (e) { var c = parseInt(e.casilla, 10); if (c > 0 && c < N) esp[c] = { texto: e.texto, mover: parseInt(e.mover, 10) || 0 }; });
    var COL = 6, filas = Math.ceil((N + 1) / COL), S = 100, W = COL * S, H = filas * S;
    var pos = function (i) { var r = Math.floor(i / COL), c = i % COL; if (r % 2) c = COL - 1 - c; return { x: c * S + S / 2, y: H - (r * S + S / 2) }; };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Tablero">';
    for (var i = 0; i <= N; i++) { var p = pos(i), f = i === 0 ? '#EEF9F2' : i === N ? '#FFF3B0' : esp[i] ? (esp[i].mover >= 0 ? '#DCEBFF' : '#FFE1DC') : (i % 2 ? '#FFFFFF' : '#F5F8FD'); svg += '<rect x="' + (p.x - S / 2 + 3) + '" y="' + (p.y - S / 2 + 3) + '" width="' + (S - 6) + '" height="' + (S - 6) + '" rx="12" fill="' + f + '" stroke="#9FBCE6" stroke-width="2"/><text x="' + (p.x - S / 2 + 12) + '" y="' + (p.y - S / 2 + 24) + '" font-size="17" font-weight="800" fill="#073B7A">' + (i === 0 ? 'Salida' : i === N ? 'Meta' : i) + '</text>' + (esp[i] ? '<text x="' + p.x + '" y="' + (p.y + 14) + '" font-size="26" text-anchor="middle">' + (esp[i].mover >= 0 ? '⇧' : '⇩') + '</text>' : (i > 0 && i < N ? '<text x="' + p.x + '" y="' + (p.y + 16) + '" font-size="30" text-anchor="middle" fill="#CFE0F7" font-weight="900">?</text>' : '')); }
    svg += '<g class="fichas"></g></svg>';
    b.appendChild(el('ul', '', (d.reglas && d.reglas.length ? d.reglas : ['Lanza el dado y avanza.', 'En cada casilla responde una pregunta: si fallas, retrocedes 1.', 'Las flechas son atajos o trampas.', 'Gana quien llegue primero a la Meta.']).map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('')));
    var conf = el('div', 'sj-jug', '<label>Jugadores: <select><option>2</option><option>3</option><option>4</option></select></label>');
    var tablero = el('div', 'sj-board', svg), jugadores = [], turno = 0, fin = false;
    var est = el('div', 'sj-jug'), dado = el('span', 'sj-dado', '🎲'), zonaCarta = el('div');
    function pintarFichas() {
      var g = tablero.querySelector('.fichas'); g.innerHTML = '';
      jugadores.forEach(function (j, n) { var p = pos(Math.min(j.c, N)); g.insertAdjacentHTML('beforeend', '<circle cx="' + (p.x - 22 + (n % 2) * 44) + '" cy="' + (p.y + 26 - Math.floor(n / 2) * 20) + '" r="13" fill="' + j.color + '" stroke="#fff" stroke-width="3"/>'); });
      est.innerHTML = jugadores.map(function (j, n) { return '<span class="' + (n === turno && !fin ? 'turno' : '') + '"><i style="background:' + j.color + '"></i>' + esc(j.nombre) + ' · casilla ' + Math.min(j.c, N) + '</span>'; }).join('');
    }
    function siguiente() { if (!fin) { turno = (turno + 1) % jugadores.length; pintarFichas(); } }
    function preguntar(j) {
      if (!mazo.length) { siguiente(); return; }
      var q = mazo[carta++ % mazo.length], c = el('div', 'sj-carta', '<p><strong>' + esc(j.nombre) + ':</strong> ' + esc(q.pregunta) + '</p>');
      var resolver = function (bien) { c.appendChild(el('div', 'sj-res', bien ? '<strong>¡Correcto!</strong> Te quedas en tu casilla.' : 'Incorrecto: retrocedes 1. ' + (q.opciones ? 'Era: ' + esc(q.opciones[q.correcta]) : ''))); if (!bien) j.c = Math.max(0, j.c - 1); sonido(bien ? 880 : 220); c.appendChild(boton('Siguiente turno', '', function () { zonaCarta.innerHTML = ''; siguiente(); })); pintarFichas(); };
      if (Array.isArray(q.opciones) && q.opciones.length) q.opciones.forEach(function (o, n) { var bt = el('button', 'sr-op', esc(o)); bt.type = 'button'; bt.onclick = function () { if (c.dataset.ok) return; c.dataset.ok = 1; bt.classList.add(n === Number(q.correcta) ? 'ok' : 'no'); resolver(n === Number(q.correcta)); }; c.appendChild(bt); });
      else { c.appendChild(boton('Ver respuesta', 'alt', function (e) { e.target.replaceWith(el('p', '', 'Respuesta: ' + esc(q.respuesta || ''))); var f = el('div'); f.appendChild(boton('Acertó', '', function () { f.remove(); resolver(true); })); f.appendChild(boton('No acertó', 'nar', function () { f.remove(); resolver(false); })); c.appendChild(f); })); }
      zonaCarta.innerHTML = ''; zonaCarta.appendChild(c);
    }
    var lanzar = boton('Lanzar el dado', '', function () {
      if (fin || zonaCarta.querySelector('.sj-carta') && !zonaCarta.querySelector('.sj-res')) return;
      zonaCarta.innerHTML = '';
      var j = jugadores[turno], n = 1 + Math.floor(Math.random() * 6); dado.textContent = n; j.c += n;
      if (esp[j.c]) { zonaCarta.appendChild(el('div', 'sj-pista', '<strong>Casilla ' + j.c + ':</strong> ' + esc(esp[j.c].texto || ''))); j.c = Math.max(0, Math.min(N, j.c + esp[j.c].mover)); }
      if (j.c >= N) { j.c = N; fin = true; pintarFichas(); zonaCarta.appendChild(el('div', 'sj-ok', '<strong>¡' + esc(j.nombre) + ' llegó a la Meta!</strong> Repasen juntos las preguntas que fallaron.')); sonido(1046); return; }
      pintarFichas(); preguntar(j);
    });
    var empezar = boton('Empezar partida', '', function () {
      var n = parseInt(conf.querySelector('select').value, 10); jugadores = []; for (var q = 0; q < n; q++) jugadores.push({ nombre: 'Equipo ' + (q + 1), color: COLORES[q], c: 0 });
      turno = 0; fin = false; mazo = barajar(preguntas); carta = 0; zonaCarta.innerHTML = ''; pintarFichas(); lanzar.disabled = false;
    });
    conf.appendChild(empezar); b.appendChild(conf); b.appendChild(tablero);
    var ctr = el('div'); ctr.appendChild(dado); ctr.appendChild(lanzar); lanzar.disabled = true;
    b.appendChild(est); b.appendChild(ctr); b.appendChild(zonaCarta);
    b.appendChild(boton('Imprimir tablero y cartas', 'alt', function () { imprimir(d.titulo, '<h1>' + esc(d.titulo) + '</h1>' + svg.replace('<g class="fichas"></g>', '') + '<div class="salto"><h2>Cartas de preguntas (recorta)</h2><table>' + preguntas.map(function (q, n) { return (n % 2 ? '' : '<tr>') + '<td><b>' + (n + 1) + '.</b> ' + esc(q.pregunta) + (q.opciones ? '<br>' + q.opciones.map(function (o) { return '( ) ' + esc(o); }).join('<br>') : '') + '<br><small>Respuesta: ' + esc(q.opciones ? q.opciones[q.correcta] : q.respuesta || '') + '</small></td>' + (n % 2 ? '</tr>' : ''); }).join('') + '</table></div>'); }));
    return k.box;
  }

  // ------------------------------------------------------------------ ESTACIONES
  function estaciones(d) {
    var k = caja2('estaciones', d.titulo || 'Estaciones de aprendizaje'), b = k.body, est = d.estaciones || [], min = Math.max(3, Math.min(40, parseInt(d.minutos, 10) || 12));
    b.appendChild(el('div', 'sj-est', est.map(function (e, i) { return '<div><h5>' + (i + 1) + '. ' + esc(e.nombre) + '</h5><p class="sr-note">' + esc(e.objetivo || '') + '</p>' + ((e.materiales || []).length ? '<p><strong>Materiales:</strong> ' + e.materiales.map(esc).join(', ') + '</p>' : '') + '<ol>' + (e.instrucciones || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' + (e.producto ? '<p><strong>Evidencia:</strong> ' + esc(e.producto) + '</p>' : '') + '</div>'; }).join('')));
    var ronda = 0, resta = min * 60, t = null, reloj = el('div', 'sj-reloj', min + ':00'), rot = el('div', 'sj-rot');
    function tabla() { rot.innerHTML = '<table><tr><th>Ronda</th>' + est.map(function (_, g) { return '<th>Grupo ' + (g + 1) + '</th>'; }).join('') + '</tr>' + est.map(function (_, r) { return '<tr class="' + (r === ronda ? 'act' : '') + '"><td>' + (r + 1) + '</td>' + est.map(function (_, g) { return '<td>Estación ' + ((g + r) % est.length + 1) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; }
    function tic() { resta--; if (resta <= 0) { sonido(660); setTimeout(function () { sonido(880); }, 300); ronda++; if (ronda >= est.length) { clearInterval(t); t = null; reloj.textContent = '¡Terminaron todas las estaciones!'; tabla(); return; } resta = min * 60; tabla(); } reloj.textContent = Math.floor(resta / 60) + ':' + ('0' + resta % 60).slice(-2); }
    b.appendChild(el('h4', '', 'Rotación (' + min + ' minutos por estación)')); b.appendChild(reloj);
    b.appendChild(boton('Iniciar / pausar', '', function () { if (t) { clearInterval(t); t = null; } else { if (ronda >= est.length) { ronda = 0; resta = min * 60; } t = setInterval(function () { if (!document.body.contains(b)) return clearInterval(t); tic(); }, 1000); } }));
    b.appendChild(boton('Siguiente estación', 'alt', function () { resta = 1; tic(); }));
    tabla(); b.appendChild(rot);
    return k.box;
  }

  // ------------------------------------------------------------------ MATERIAL MANIPULATIVO (plantillas generadas por código)
  function plantilla(tipo, p) {
    p = p || {}; var s = '', W = 760;
    if (tipo === 'fracciones') {
      var dens = (Array.isArray(p.denominadores) ? p.denominadores : [1, 2, 3, 4, 5, 6, 8, 10, 12]).map(Number).filter(function (n) { return n >= 1 && n <= 24; }); if (dens[0] !== 1) dens.unshift(1);
      var h = 56; s = '<svg viewBox="0 0 ' + W + ' ' + (dens.length * (h + 10) + 10) + '">';
      dens.forEach(function (n, r) { var y = 10 + r * (h + 10), w = (W - 20) / n; for (var c = 0; c < n; c++) s += '<rect x="' + (10 + c * w) + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + U.SERIE[r % U.SERIE.length] + '" fill-opacity=".18" stroke="#073B7A" stroke-width="2"/><text x="' + (10 + c * w + w / 2) + '" y="' + (y + h / 2 + 7) + '" text-anchor="middle" font-size="' + (n > 10 ? 14 : 20) + '" font-weight="800" fill="#073B7A">' + (n === 1 ? '1' : '1/' + n) + '</text>'; });
      return s + '</svg>';
    }
    if (tipo === 'reloj') {
      s = '<svg viewBox="0 0 ' + W + ' 380"><circle cx="190" cy="190" r="170" fill="#fff" stroke="#073B7A" stroke-width="5"/>';
      for (var m = 0; m < 60; m++) { var a = m * Math.PI / 30, r1 = m % 5 ? 160 : 148; s += '<line x1="' + (190 + 168 * Math.sin(a)) + '" y1="' + (190 - 168 * Math.cos(a)) + '" x2="' + (190 + r1 * Math.sin(a)) + '" y2="' + (190 - r1 * Math.cos(a)) + '" stroke="#073B7A" stroke-width="' + (m % 5 ? 2 : 4) + '"/>'; }
      for (var hh = 1; hh <= 12; hh++) { var b2 = hh * Math.PI / 6; s += '<text x="' + (190 + 122 * Math.sin(b2)) + '" y="' + (200 - 122 * Math.cos(b2)) + '" text-anchor="middle" font-size="30" font-weight="800" fill="#073B7A">' + hh + '</text><text x="' + (190 + 92 * Math.sin(b2)) + '" y="' + (196 - 92 * Math.cos(b2)) + '" text-anchor="middle" font-size="13" fill="#FF8A00">' + ((hh * 5) % 60 === 0 ? '00' : hh * 5) + '</text>'; }
      s += '<circle cx="190" cy="190" r="6" fill="#073B7A"/><text x="430" y="40" font-size="16" font-weight="800" fill="#073B7A">Manecillas para recortar:</text><path d="M430 90h220l20 12-20 12H430z" fill="#064FAE"/><circle cx="445" cy="102" r="5" fill="#fff"/><text x="430" y="140" font-size="14">Minutero (larga)</text><path d="M430 190h150l20 14-20 14H430z" fill="#FF8A00"/><circle cx="445" cy="204" r="5" fill="#fff"/><text x="430" y="244" font-size="14">Horario (corta)</text><text x="430" y="300" font-size="14">Une con un gancho mariposa en el centro.</text>';
      return s + '</svg>';
    }
    if (tipo === 'recta') {
      var de = Number(p.desde), ha = Number(p.hasta), pa = Number(p.paso); if (!isFinite(de)) de = 0; if (!isFinite(ha) || ha <= de) ha = de + 20; if (!(pa > 0)) pa = 1;
      var marcas = Math.min(200, Math.floor((ha - de) / pa) + 1), porFila = 21, nf = Math.ceil(marcas / porFila); s = '<svg viewBox="0 0 ' + W + ' ' + (nf * 90 + 10) + '">';
      for (var f = 0; f < nf; f++) { var y = 50 + f * 90, n0 = f * porFila, n1 = Math.min(marcas, n0 + porFila), paso = (W - 40) / (porFila - 1); s += '<line x1="15" y1="' + y + '" x2="' + (20 + (n1 - n0 - 1) * paso + 10) + '" y2="' + y + '" stroke="#073B7A" stroke-width="4"/>'; for (var q = n0; q < n1; q++) { var x = 20 + (q - n0) * paso, v = Math.round((de + q * pa) * 1000) / 1000; s += '<line x1="' + x + '" y1="' + (y - 12) + '" x2="' + x + '" y2="' + (y + 12) + '" stroke="#073B7A" stroke-width="3"/><text x="' + x + '" y="' + (y + 34) + '" text-anchor="middle" font-size="15" font-weight="700" fill="#073B7A">' + String(v).replace('.', ',') + '</text>'; } }
      return s + '</svg>';
    }
    if (tipo === 'tangram') {
      var z = 85, P = [[[0, 0], [4, 0], [2, 2]], [[0, 0], [2, 2], [0, 4]], [[4, 4], [4, 2], [2, 4]], [[4, 0], [4, 2], [3, 1]], [[2, 2], [3, 1], [4, 2], [3, 3]], [[2, 2], [3, 3], [1, 3]], [[0, 4], [1, 3], [3, 3], [2, 4]]];
      s = '<svg viewBox="0 0 ' + W + ' 370"><g transform="translate(20,15)">' + P.map(function (pl, i) { return '<polygon points="' + pl.map(function (pt) { return pt[0] * z + ',' + pt[1] * z; }).join(' ') + '" fill="' + U.SERIE[i % U.SERIE.length] + '" fill-opacity=".3" stroke="#073B7A" stroke-width="3"/>'; }).join('') + '</g><text x="400" y="60" font-size="18" font-weight="800" fill="#073B7A">Tangram de 7 piezas</text><text x="400" y="95" font-size="15">Recorta por las líneas. Con las 7 piezas</text><text x="400" y="118" font-size="15">arma figuras: gato, casa, barco, persona.</text><text x="400" y="150" font-size="15">Reto: ¿qué fracción del cuadrado</text><text x="400" y="172" font-size="15">es cada pieza? (pista: el triángulo</text><text x="400" y="194" font-size="15">grande es 1/4)</text></svg>';
      return s;
    }
    if (tipo === 'base10') {
      var u = 18; s = '<svg viewBox="0 0 ' + W + ' 440">';
      for (var pl2 = 0; pl2 < 2; pl2++) { for (var a1 = 0; a1 < 10; a1++) for (var b1 = 0; b1 < 10; b1++) s += '<rect x="' + (10 + pl2 * 200 + b1 * u) + '" y="' + (10 + a1 * u) + '" width="' + u + '" height="' + u + '" fill="#DCEBFF" stroke="#073B7A"/>'; }
      for (var bar = 0; bar < 10; bar++) for (var c1 = 0; c1 < 10; c1++) s += '<rect x="' + (420 + bar * 32) + '" y="' + (10 + c1 * u) + '" width="' + u + '" height="' + u + '" fill="#FFE7C7" stroke="#9A4A00"/>';
      for (var un = 0; un < 30; un++) s += '<rect x="' + (10 + (un % 15) * 30) + '" y="' + (220 + Math.floor(un / 15) * 30) + '" width="' + u + '" height="' + u + '" fill="#D6F2E1" stroke="#108A4F"/>';
      return s + '<text x="10" y="320" font-size="15" fill="#073B7A">Placas = 100 · Barras = 10 · Cubos = 1. Recorta y representa números: 245 = 2 placas, 4 barras, 5 cubos.</text></svg>';
    }
    if (tipo === 'geoplano') {
      var nP = Math.max(4, Math.min(12, parseInt(p.puntos, 10) || 10)), sp = 34; s = '<svg viewBox="0 0 ' + (nP * sp + 20) + ' ' + (nP * sp + 20) + '">';
      for (var gy = 0; gy < nP; gy++) for (var gx = 0; gx < nP; gx++) s += '<circle cx="' + (20 + gx * sp) + '" cy="' + (20 + gy * sp) + '" r="4.5" fill="#073B7A"/>';
      return s + '</svg>';
    }
    return '';
  }
  function manipulativo(d) {
    var k = caja2('manipulativo', d.titulo || 'Material manipulativo'), b = k.body, svg = plantilla(d.plantilla, d.parametros);
    if ((d.materiales || []).length) b.appendChild(el('p', '', '<strong>Materiales:</strong> ' + d.materiales.map(esc).join(', ')));
    if (svg) { var w = el('div', 'sj-plant', svg); b.appendChild(w); }
    if ((d.construccion || []).length) b.appendChild(el('div', '', '<h4>Así se construye</h4><ol>' + d.construccion.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>'));
    if ((d.uso || []).length) b.appendChild(el('div', '', '<h4>Así se aprende con él</h4><ol>' + d.uso.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>'));
    if (svg) { b.appendChild(boton('Imprimir plantilla', '', function () { imprimir(d.titulo, '<h1>' + esc(d.titulo) + '</h1>' + svg + '<h2>Construcción</h2><ol>' + (d.construccion || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>'); })); var s = b.querySelector('.sj-plant svg'); if (s) b.appendChild(U.descargarSVG(s, d.titulo)); }
    return k.box;
  }

  // ------------------------------------------------------------------ LAPBOOK
  var TIPOS_SOLAPA = { solapa: 'Solapa', bolsillo: 'Bolsillo', acordeon: 'Acordeón', rueda: 'Rueda' };
  function lapbook(d) {
    var k = caja2('lapbook', d.titulo || 'Lapbook'), b = k.body, sol = d.solapas || [];
    b.appendChild(el('p', 'sr-note', 'Toca cada solapa para abrirla. Al imprimir: recorta por la línea discontinua, dobla por la punteada y pega en una carpeta.'));
    var g = el('div', 'sj-lap');
    sol.forEach(function (s) { var f = el('div', 'sj-flap', '<small>' + esc(TIPOS_SOLAPA[s.tipo] || 'Solapa') + '</small><div class="tapa">' + esc(s.titulo) + '</div><div class="dentro">' + esc(s.contenido) + '</div>'); f.tabIndex = 0; f.onclick = function () { f.classList.toggle('on'); }; f.onkeydown = function (e) { if (e.key === 'Enter') f.classList.toggle('on'); }; g.appendChild(f); });
    b.appendChild(g);
    b.appendChild(boton('Imprimir lapbook', '', function () { imprimir(d.titulo, '<h1>' + esc(d.titulo) + '</h1><p>Recorta por - - -, dobla por ····· y pega la mitad de abajo en tu carpeta.</p><table>' + sol.map(function (s, n) { return (n % 2 ? '' : '<tr>') + '<td style="border:2px dashed #444;width:50%;padding:0"><div style="padding:14px;min-height:80px;font-weight:800;text-align:center;font-size:18px">' + esc(s.titulo) + '</div><div style="border-top:2px dotted #444;padding:12px;min-height:110px">' + esc(s.contenido) + '</div></td>' + (n % 2 ? '</tr>' : ''); }).join('') + '</table>'); }));
    return k.box;
  }

  // ------------------------------------------------------------------ PUZZLE (parejas, ordenar, clasificar)
  function puzzle(d) {
    var modo = d.modo || (d.parejas ? 'parejas' : d.categorias ? 'clasificar' : 'ordenar'), k = caja2('puzzle', d.titulo || 'Puzzle'), b = k.body;
    if (modo === 'parejas') {
      var par = (d.parejas || []).filter(function (p) { return p.a && p.b; }).slice(0, 10), cartas = barajar([].concat(par.map(function (p, i) { return { t: p.a, i: i }; }), par.map(function (p, i) { return { t: p.b, i: i }; }))), abiertas = [], hechos = 0, mov = 0;
      var g = el('div', 'sj-mem'), info = el('p', 'sr-note', 'Encuentra cada concepto con su pareja.');
      cartas.forEach(function (c) { var bt = el('button', '', '?'); bt.type = 'button'; bt.onclick = function () { if (bt.classList.contains('vis') || bt.classList.contains('ok') || abiertas.length === 2) return; bt.classList.add('vis'); bt.innerHTML = esc(c.t); abiertas.push({ bt: bt, c: c }); if (abiertas.length === 2) { mov++; var x = abiertas[0], y = abiertas[1]; if (x.c.i === y.c.i) { x.bt.className = y.bt.className = 'ok'; abiertas = []; hechos++; sonido(880); info.innerHTML = hechos === par.length ? '<strong>¡Completaste todas las parejas en ' + mov + ' intentos!</strong>' : 'Parejas: ' + hechos + ' de ' + par.length; } else setTimeout(function () { x.bt.className = y.bt.className = ''; x.bt.textContent = y.bt.textContent = '?'; abiertas = []; }, 1100); } }; g.appendChild(bt); });
      b.appendChild(info); b.appendChild(g);
      b.appendChild(boton('Ver todas las parejas', 'alt', function (e) { e.target.replaceWith(el('ul', '', par.map(function (p) { return '<li><strong>' + esc(p.a) + '</strong> → ' + esc(p.b) + '</li>'; }).join(''))); }));
    } else if (modo === 'clasificar') {
      var cats = (d.categorias || []).filter(function (c) { return c.nombre; }), items = barajar([].concat.apply([], cats.map(function (c, i) { return (c.items || []).map(function (t) { return { t: t, i: i }; }); }))), sel = null, puesto = {};
      var banco = el('div', ''), zonas = el('div', 'sj-cats');
      b.appendChild(el('p', 'sr-note', 'Toca un elemento y luego la categoría donde va.'));
      items.forEach(function (it, n) { var c = el('span', 'sj-chip', esc(it.t)); c.tabIndex = 0; c.dataset.n = n; c.onclick = function () { banco.querySelectorAll('.sj-chip').forEach(function (z) { z.classList.remove('sel'); }); zonas.querySelectorAll('.sj-chip').forEach(function (z) { z.classList.remove('sel'); }); sel = { c: c, n: n }; c.classList.add('sel'); }; banco.appendChild(c); });
      cats.forEach(function (ct, i) { var z = el('div', '', '<h5>' + esc(ct.nombre) + '</h5>'); z.onclick = function (e) { if (!sel || e.target.closest('.sj-chip')) return; z.appendChild(sel.c); sel.c.classList.remove('sel'); puesto[sel.n] = i; sel = null; }; zonas.appendChild(z); });
      b.appendChild(banco); b.appendChild(zonas);
      var r = el('p', 'sr-note');
      b.appendChild(boton('Comprobar', '', function () { var ok = 0; [].slice.call(b.querySelectorAll('.sj-chip')).forEach(function (c) { var n = Number(c.dataset.n); var bien = puesto[n] === items[n].i; c.classList.toggle('ok', bien); c.classList.toggle('no', puesto[n] != null && !bien); if (bien) ok++; }); r.innerHTML = '<strong>' + ok + ' de ' + items.length + '</strong> bien clasificados.'; }));
      b.appendChild(r);
    } else {
      var orden = (d.elementos || []).slice(0, 12), mezcla = barajar(orden.map(function (t, i) { return { t: t, i: i }; })), lista = el('div', 'sj-ord');
      var pintar = function () { lista.innerHTML = ''; mezcla.forEach(function (x, n) { var f = el('div', '', ''); f.style.display = 'flex'; f.style.gap = '6px'; var t = el('button', '', '<b>' + (n + 1) + '</b>' + esc(x.t)); t.type = 'button'; t.style.flex = '1'; var up = boton('↑', 'alt', function () { if (n > 0) { var a = mezcla[n - 1]; mezcla[n - 1] = mezcla[n]; mezcla[n] = a; pintar(); } }); up.setAttribute('aria-label', 'Subir'); var dn = boton('↓', 'alt', function () { if (n < mezcla.length - 1) { var a = mezcla[n + 1]; mezcla[n + 1] = mezcla[n]; mezcla[n] = a; pintar(); } }); dn.setAttribute('aria-label', 'Bajar'); f.appendChild(t); f.appendChild(up); f.appendChild(dn); lista.appendChild(f); }); };
      b.appendChild(el('p', 'sr-note', 'Usa las flechas para poner los elementos en el orden correcto.')); pintar(); b.appendChild(lista);
      var rr = el('p', 'sr-note');
      b.appendChild(boton('Comprobar', '', function () { var bien = mezcla.every(function (x, n) { return x.i === n; }); rr.innerHTML = bien ? '<strong>¡Orden perfecto!</strong>' : 'Aún no. Bien ubicados: ' + mezcla.filter(function (x, n) { return x.i === n; }).length + ' de ' + mezcla.length + '.'; if (bien) sonido(880); }));
      b.appendChild(rr);
    }
    return k.box;
  }

  // ------------------------------------------------------------------ MINILIBRO (8 páginas en una hoja)
  function minibook(d) {
    var pags = (d.paginas || []).slice(0, 8); while (pags.length < 8) pags.push('');
    var k = caja2('minibook', d.titulo || 'Minilibro'), b = k.body, i = 0, visor = el('div', 'sj-libro');
    var pintar = function () { visor.innerHTML = '<div class="sj-pag">' + (i === 0 ? '<strong style="font-size:22px">' + esc(d.titulo || '') + '</strong><br>' : '') + esc(pags[i]) + '<small>' + (i === 0 ? 'Portada' : i === 7 ? 'Contraportada' : 'Página ' + (i + 1)) + '</small></div>'; };
    pintar(); b.appendChild(visor);
    var nav = el('div'); nav.style.textAlign = 'center';
    nav.appendChild(boton('◀ Anterior', 'alt', function () { if (i > 0) { i--; pintar(); } })); nav.appendChild(boton('Siguiente ▶', 'alt', function () { if (i < 7) { i++; pintar(); } }));
    b.appendChild(nav);
    b.appendChild(boton('Imprimir minilibro (una hoja)', '', function () {
      var celda = function (n, rot) { return '<td style="width:25%;height:48%;border:1px dashed #999;text-align:center;vertical-align:middle;padding:10px;font-size:15px;' + (rot ? 'transform:rotate(180deg)' : '') + '">' + (n === 1 ? '<b style="font-size:20px">' + esc(d.titulo || '') + '</b><br>' : '') + esc(pags[n - 1]) + '<br><small>' + n + '</small></td>'; };
      imprimir(d.titulo, '<table style="width:100%;height:180mm;table-layout:fixed"><tr>' + celda(5, 1) + celda(4, 1) + celda(3, 1) + celda(2, 1) + '</tr><tr>' + celda(6) + celda(7) + celda(8) + celda(1) + '</tr></table><p style="font-size:12px">Dobla la hoja por la mitad a lo largo y a lo ancho; corta solo la línea central entre las páginas 3-4 y 7-8 (ver video «cómo hacer un minilibro de una hoja») y arma el librito.</p>', true);
    }));
    return k.box;
  }

  // ------------------------------------------------------------------ FODA y AUTOEVALUACIÓN
  function foda(d) {
    var k = caja2('foda', d.titulo || 'Análisis FODA'), q = [['fortalezas', 'Fortalezas', '#EEF9F2', '#108A4F'], ['oportunidades', 'Oportunidades', '#EEF5FF', '#064FAE'], ['debilidades', 'Debilidades', '#FFF7EF', '#B85A00'], ['amenazas', 'Amenazas', '#FFF4F2', '#C0392B']];
    k.body.appendChild(el('div', 'sj-foda', q.map(function (c) { return '<div style="background:' + c[2] + '"><h5 style="color:' + c[3] + '">' + c[1] + '</h5><ul>' + [].concat(d[c[0]] || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>'; }).join('')));
    return k.box;
  }
  function autoevaluacion(d) {
    var k = caja2('autoevaluacion', 'Autoevaluación de SABI'), conf = Math.max(0, Math.min(100, Number(d.confianza) || 0));
    k.body.innerHTML = '<ul style="list-style:none;margin:0;padding:0">' + (d.criterios || []).map(function (c) { return '<li style="margin:6px 0"><strong style="color:' + (c.cumple ? '#108A4F' : '#C0392B') + '">' + (c.cumple ? '✔' : '✘') + '</strong> <strong>' + esc(c.criterio) + ':</strong> ' + esc(c.nota || '') + '</li>'; }).join('') + '</ul>' +
      '<p><strong>Confianza en esta respuesta: ' + conf + ' %</strong></p><div class="sj-meter"><i style="width:' + conf + '%"></i></div>' + ((d.mejoras || []).length ? '<p><strong>Lo que verificaría o mejoraría:</strong></p><ul>' + d.mejoras.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '');
    return k.box;
  }

  var R = SabiRecursos.registrar;
  R('experimento', experimento, 'Experimento · Predice, observa, explica'); R('ficha', ficha, 'Ficha de matemáticas'); R('lectura', lectura, 'Lectura: comprender, relacionar y pensar');
  R('worksheet', worksheet, 'Hoja de trabajo'); R('escape', escape, 'Escape room'); R('detective', detective, 'Detective'); R('boardgame', boardgame, 'Juego de mesa');
  R('estaciones', estaciones, 'Estaciones de aprendizaje'); R('stations', estaciones, 'Estaciones de aprendizaje'); R('manipulativo', manipulativo, 'Material manipulativo'); R('manipulative', manipulativo, 'Material manipulativo');
  R('lapbook', lapbook, 'Lapbook'); R('puzzle', puzzle, 'Puzzle'); R('minibook', minibook, 'Minilibro'); R('foda', foda, 'FODA'); R('swot', foda, 'FODA'); R('autoevaluacion', autoevaluacion, 'Autoevaluación');
  window.SabiJuegos = { experimento: experimento, normalizar: normalizar, cargarExperimentos: cargarExperimentos, iguales: iguales, plantilla: plantilla, imprimir: imprimir, estilos: estilos, EJES: EJES, GRADO: GRADO };
})();
