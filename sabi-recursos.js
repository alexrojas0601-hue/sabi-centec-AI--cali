/*!
 * SABI RECURSOS · convierte los bloques ```sabi``` y ```mermaid``` de la IA en recursos visuales e interactivos.
 * Prompt Maestro: "No te limites a describir los recursos: prodúcelos" — y explícalos.
 * Tipos: grafica, pasos, flashcards, quiz, timeline, 5w1h, sopa, crucigrama, comic, sketchnote, fuentes, proyecto, sintesis
 * Uso:  const r = SabiRecursos.extraer(texto)  →  { texto (con [[SABIRECURSO:n]]), recursos }
 *       SabiRecursos.montar(contenedor, r.recursos)   (después de pintar el texto)
 */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var C = { navy: '#073B7A', azul: '#064FAE', naranja: '#FF8A00', verde: '#108A4F', rojo: '#C0392B', oro: '#F5C518', morado: '#7A5AC8', gris: '#4B5A70', borde: '#D8E5F8' };
  var SERIE = ['#064FAE', '#FF8A00', '#108A4F', '#7A5AC8', '#C0392B', '#0F766E'];

  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', 'n': 'ⁿ', 'x': 'ˣ', 't': 'ᵗ' };
  function libro(t) { return String(t).replace(/\^\(?(-?\d+|n|x|t)\)?(?![\w])/g, function (_, e) { return e.split('').map(function (c) { return SUP[c] || c; }).join(''); }).replace(/\bH2O\b/g, 'H₂O').replace(/\bCO2\b/g, 'CO₂').replace(/\bO2\b/g, 'O₂'); }
  function esc(t) { return libro(String(t == null ? '' : t)).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function norm(s) { return String(s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/Ñ/g, 'N').replace(/[^A-Z]/g, ''); }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function leer(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }

  // ---------------------------------------------------------------- estilos
  var CSS = '' +
    '.sr{margin:20px 0;border:1px solid #CFE0F7;border-radius:18px;background:#fff;overflow:hidden;font-family:"Public Sans",system-ui,sans-serif;font-size:16px;line-height:1.55;color:#1F1D1A;box-shadow:0 8px 22px rgba(7,59,122,.07)}' +
    '.sr-h{display:flex;justify-content:space-between;align-items:center;gap:10px;background:linear-gradient(90deg,#073B7A,#064FAE);color:#fff;padding:10px 16px;font-weight:800}' +
    '.sr-h small{font-weight:700;color:#FFD43B;text-transform:uppercase;letter-spacing:.05em;font-size:11.5px}' +
    '.sr-b{padding:16px}.sr-b p{margin:6px 0}.sr-note{color:#4B5A70;font-size:14px}' +
    '.sr button.srb{width:auto;border:0;border-radius:999px;background:#064FAE;color:#fff;font-weight:800;font-size:14.5px;padding:9px 16px;cursor:pointer;box-shadow:none;margin:4px 6px 4px 0}' +
    '.sr button.srb.alt{background:#fff;color:#073B7A;border:2px solid #073B7A}.sr button.srb.nar{background:#FF8A00}' +
    '.sr svg{max-width:100%;height:auto;display:block}' +
    '.sr-graf{position:relative}.sr-read{position:absolute;top:8px;right:10px;background:rgba(7,59,122,.9);color:#fff;border-radius:8px;padding:4px 8px;font-size:13px;font-weight:700;pointer-events:none;display:none}' +
    '.sr-leg{display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;font-size:14px}.sr-leg span{display:inline-flex;align-items:center;gap:6px}.sr-leg i{width:18px;height:4px;border-radius:2px;display:inline-block}' +
    '.sr-steps{list-style:none;margin:0;padding:0;counter-reset:p}.sr-steps li{counter-increment:p;position:relative;padding:10px 12px 10px 52px;margin:8px 0;border:1px solid #E3ECF8;border-radius:12px;background:#F8FBFF}' +
    '.sr-steps li:before{content:counter(p);position:absolute;left:12px;top:10px;width:28px;height:28px;border-radius:50%;background:#064FAE;color:#fff;font-weight:800;display:grid;place-items:center;font-size:14px}' +
    '.sr-steps li b{display:block;font-family:Cambria,Georgia,serif;font-size:1.05em}.sr-steps.pick li{cursor:pointer}.sr-steps.pick li:hover{border-color:#FF8A00}' +
    '.sr-steps li.bad{background:#FFF4F2;border-color:#C0392B}.sr-steps li.bad:before{background:#C0392B}.sr-steps li.good{background:#EEF9F2;border-color:#108A4F}' +
    '.sr-fix{margin-top:8px;padding:8px 10px;border-left:4px solid #108A4F;background:#fff;border-radius:6px}' +
    '.sr-card{perspective:900px;height:200px;cursor:pointer;margin:6px 0 12px}.sr-in{position:relative;width:100%;height:100%;transition:transform .5s;transform-style:preserve-3d}.sr-card.on .sr-in{transform:rotateY(180deg)}' +
    '.sr-f,.sr-r{position:absolute;inset:0;backface-visibility:hidden;border-radius:16px;display:grid;place-items:center;text-align:center;padding:18px;font-size:clamp(17px,2.2vw,21px);font-family:Literata,Georgia,serif}' +
    '.sr-f{background:#F2F6FD;border:2px solid #064FAE;color:#073B7A;font-weight:600}.sr-r{background:#FFF7EF;border:2px solid #FF8A00;transform:rotateY(180deg)}' +
    '.sr-prog{height:6px;background:#E3ECF8;border-radius:3px;overflow:hidden;margin-bottom:10px}.sr-prog i{display:block;height:100%;background:#FF8A00}' +
    '.sr-q{margin:0 0 16px}.sr-q h4{margin:0 0 8px;color:#073B7A;font-size:17px}.sr-op{display:block;width:100%;text-align:left;border:1.5px solid #CFE0F7;background:#fff;border-radius:12px;padding:10px 14px;margin:6px 0;font-size:15.5px;cursor:pointer;color:#1F1D1A;font-weight:600;box-shadow:none}' +
    '.sr-op:hover{border-color:#064FAE}.sr-op.ok{background:#EEF9F2;border-color:#108A4F}.sr-op.no{background:#FFF4F2;border-color:#C0392B}.sr-exp{margin-top:6px;padding:8px 12px;border-radius:10px;background:#F5F8FD;font-size:15px}' +
    '.sr-tl{position:relative;margin:4px 0 0 10px;padding-left:24px;border-left:4px solid #CFE0F7}.sr-tl div{position:relative;margin:0 0 16px}.sr-tl div:before{content:"";position:absolute;left:-33px;top:4px;width:14px;height:14px;border-radius:50%;background:#FF8A00;border:3px solid #fff;box-shadow:0 0 0 2px #FF8A00}' +
    '.sr-tl b{color:#064FAE;font-size:14px;letter-spacing:.03em}.sr-tl strong{display:block;font-family:Literata,Georgia,serif;font-size:17px;color:#073B7A}' +
    '.sr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.sr-cell{border:1px solid #E3ECF8;border-radius:14px;padding:12px;background:#F8FBFF}.sr-cell h5{margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#FF8A00}' +
    '.sr-sopa{display:grid;gap:2px;user-select:none;margin:0 auto 12px;max-width:520px;touch-action:manipulation}.sr-sopa span{aspect-ratio:1;display:grid;place-items:center;font-weight:800;font-size:clamp(12px,2.6vw,18px);background:#F2F6FD;border-radius:5px;cursor:pointer;color:#073B7A}' +
    '.sr-sopa span.sel{background:#FFD43B}.sr-sopa span.hit{background:#108A4F;color:#fff}.sr-words{display:flex;flex-wrap:wrap;gap:8px}.sr-words span{border:1px solid #CFE0F7;border-radius:999px;padding:4px 10px;font-weight:700;font-size:14px}.sr-words span.hit{text-decoration:line-through;background:#EEF9F2;color:#108A4F}' +
    '.sr-cw{display:grid;gap:2px;margin:0 auto 12px;max-width:560px}.sr-cw div{aspect-ratio:1;position:relative}.sr-cw div.c{background:#fff;border:1.5px solid #073B7A;border-radius:3px}.sr-cw input{width:100%;height:100%;border:0;background:transparent;text-align:center;font-weight:800;font-size:clamp(11px,2.4vw,18px);text-transform:uppercase;padding:0;color:#073B7A;outline:none}' +
    '.sr-cw input:focus{background:#FFF3B0}.sr-cw sup{position:absolute;top:0;left:2px;font-size:9px;color:#4B5A70;font-weight:700}.sr-cw div.ok{background:#EEF9F2}.sr-cw div.no{background:#FFF4F2}' +
    '.sr-clues{display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:15px}.sr-clues h5{margin:0 0 4px;color:#073B7A}.sr-clues ol{margin:0;padding-left:0;list-style:none}.sr-clues li{margin:4px 0}' +
    '.sr-comic{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}.sr-panel{border:3px solid #1F1D1A;border-radius:6px;background:#FFFDF6;padding:10px;min-height:220px;display:flex;flex-direction:column;gap:8px}' +
    '.sr-esc{font-size:12.5px;font-style:italic;color:#4B5A70;background:#FFF3B0;border:1px solid #E5C100;padding:3px 7px;border-radius:4px;align-self:flex-start}.sr-bub{display:flex;gap:8px;align-items:flex-start}.sr-bub svg{width:44px;flex-shrink:0}' +
    '.sr-bub p{margin:0;background:#fff;border:2px solid #1F1D1A;border-radius:14px;padding:6px 10px;font-size:14.5px;position:relative}.sr-bub em{display:block;font-style:normal;font-weight:800;font-size:11.5px;color:#064FAE;text-transform:uppercase}' +
    '.sr-sk{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;background:#FFFDF6;padding:6px}.sr-sk div{border:2px dashed #073B7A;border-radius:16px 22px 14px 20px;padding:12px;background:#fff;display:flex;gap:10px;align-items:flex-start;font-family:"Comic Sans MS","Segoe Print",Literata,cursive;font-size:15.5px}' +
    '.sr-sk div:nth-child(odd){transform:rotate(-.8deg)}.sr-sk div:nth-child(even){transform:rotate(.7deg)}.sr-sk svg{width:38px;flex-shrink:0}' +
    '.sr-links{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;margin:8px 0 12px}.sr-links a{display:block;border:1px solid #CFE0F7;border-left:5px solid #064FAE;border-radius:10px;padding:8px 12px;text-decoration:none;color:#073B7A;font-weight:800}.sr-links a small{display:block;font-weight:600;color:#4B5A70}' +
    '.sr-chips{display:flex;flex-wrap:wrap;gap:6px}.sr-chips span{background:#EEF5FF;border:1px solid #CFE0F7;color:#073B7A;border-radius:999px;padding:4px 10px;font-weight:700;font-size:13.5px}' +
    '.sr-chk label{display:flex;gap:8px;align-items:flex-start;margin:6px 0;font-size:15px}.sr-apa{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px;margin:8px 0}.sr-apa input{border:1px solid #C9D6EC;border-radius:8px;padding:7px 9px;font-size:14px;width:100%}' +
    '.sr-cita{background:#F5F8FD;border-radius:10px;padding:10px 12px;font-family:Literata,Georgia,serif;font-size:15px;min-height:22px}' +
    '.sr-sec{margin:0 0 14px}.sr-sec h5{margin:0 0 4px;color:#073B7A;font-size:16px}.sr-sec h5 span{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#FF8A00;color:#fff;font-size:13px;margin-right:6px}' +
    '.sr table{border-collapse:collapse;width:100%;font-size:14.5px}.sr th{background:#1A2D7A;color:#fff;text-align:left;padding:7px 10px}.sr td{border-top:1px solid #E3ECF8;padding:7px 10px}.sr tr.tot td{font-weight:800;background:#FFF7EF}' +
    '.sr-gantt{display:grid;gap:4px}.sr-gantt div{display:grid;grid-template-columns:minmax(120px,38%) 1fr;gap:8px;align-items:center;font-size:14px}.sr-gantt i{display:block;height:14px;border-radius:7px;background:#FF8A00}' +
    '.sr-quad{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sr-quad div{border-radius:14px;padding:12px;border:1px solid #E3ECF8}.sr-quad h5{margin:0 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:.05em}.sr-quad ul{margin:0;padding-left:18px}' +
    '.sr-mm{overflow-x:auto;text-align:center}.sr-mm pre{text-align:left;white-space:pre-wrap;font-size:13px;background:#F5F8FD;padding:10px;border-radius:10px}' +
    '@media(max-width:640px){.sr-clues,.sr-quad{grid-template-columns:1fr}.sr-card{height:230px}}' +
    '@media print{.sr button{display:none}}';
  function estilos() { if (document.getElementById('sr-css')) return; var s = el('style'); s.id = 'sr-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ---------------------------------------------------------------- extracción
  function repararJSON(t) {
    var s = String(t).trim().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/,\s*([}\]])/g, '$1');
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < a) return null;
    try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  }
  function extraer(texto) {
    var recursos = [];
    var t = String(texto || '').replace(/```\s*(sabi|mermaid|json)\s*\n?([\s\S]*?)```/gi, function (_, tipo, cuerpo) {
      tipo = tipo.toLowerCase();
      if (tipo === 'mermaid') { recursos.push({ kind: 'mermaid', code: cuerpo.trim() }); }
      else {
        var d = repararJSON(cuerpo);
        if (!d || !d.tipo) return tipo === 'json' ? _ : '';
        recursos.push({ kind: 'sabi', data: d });
      }
      return '\n[[SABIRECURSO:' + (recursos.length - 1) + ']]\n';
    });
    // Otros bloques de código: se muestran como código legible
    t = t.replace(/```[a-z]*\n?([\s\S]*?)```/gi, function (_, c) { recursos.push({ kind: 'code', code: c }); return '\n[[SABIRECURSO:' + (recursos.length - 1) + ']]\n'; });
    return { texto: t, recursos: recursos };
  }

  // ---------------------------------------------------------------- caja común
  var NOMBRES = { grafica: 'Gráfica interactiva', pasos: 'Paso a paso', flashcards: 'Flashcards', quiz: 'Quiz tipo Saber 11', timeline: 'Línea de tiempo', '5w1h': '5W1H', sopa: 'Sopa de letras', crucigrama: 'Crucigrama', comic: 'Cómic', sketchnote: 'Sketchnotes', fuentes: 'Modo investigador', proyecto: 'Proyecto', sintesis: 'Síntesis para dominar el tema', mermaid: 'Diagrama', code: 'Código' };
  function caja(tipo, titulo) {
    var box = el('section', 'sr'); box.setAttribute('data-tipo', tipo);
    box.innerHTML = '<div class="sr-h"><span>' + esc(titulo || NOMBRES[tipo] || 'Recurso') + '</span><small>' + esc(NOMBRES[tipo] || '') + '</small></div><div class="sr-b"></div>';
    return { box: box, body: box.querySelector('.sr-b') };
  }
  function descargarSVG(svg, nombre) {
    var b = el('button', 'srb alt', 'Descargar imagen'); b.type = 'button';
    b.onclick = function () {
      var s = svg.cloneNode(true); s.setAttribute('xmlns', NS);
      var blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>' + new XMLSerializer().serializeToString(s)], { type: 'image/svg+xml' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (nombre || 'sabi-recurso').replace(/[^\w\-]+/g, '-').toLowerCase() + '.svg'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    };
    return b;
  }

  // ---------------------------------------------------------------- gráficas (parser seguro, sin eval)
  var FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sen: Math.sin, sqrt: Math.sqrt, raiz: Math.sqrt, log: function (v) { return Math.log10(v); }, ln: Math.log, exp: Math.exp, abs: Math.abs, asin: Math.asin, acos: Math.acos, atan: Math.atan };
  function compilar(expr) {
    var s = String(expr || '').replace(/^[a-z]\s*\(\s*x\s*\)\s*=|^y\s*=/i, '').replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/,/g, '.').toLowerCase();
    var tk = [], i = 0, m;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if ((m = s.slice(i).match(/^\d+(\.\d+)?/))) { tk.push({ t: 'n', v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if ((m = s.slice(i).match(/^[a-z]+/))) {
        var w = m[0]; i += w.length;
        if (w === 'x') tk.push({ t: 'x' }); else if (w === 'pi') tk.push({ t: 'n', v: Math.PI }); else if (w === 'e') tk.push({ t: 'n', v: Math.E });
        else if (FN[w]) tk.push({ t: 'f', v: w }); else throw new Error('símbolo ' + w);
        continue;
      }
      if ('+-*/^()'.indexOf(c) >= 0) { tk.push({ t: c }); i++; continue; }
      throw new Error('carácter ' + c);
    }
    // multiplicación implícita: 2x, 2(…), x(…), )(…), )x, 2sin
    var t2 = [];
    tk.forEach(function (k, j) {
      var p = t2[t2.length - 1];
      if (p && (p.t === 'n' || p.t === 'x' || p.t === ')') && (k.t === 'n' || k.t === 'x' || k.t === '(' || k.t === 'f')) t2.push({ t: '*' });
      t2.push(k);
    });
    // unario: - al inicio o tras operador/(
    var out = [], ops = [], prev = null;
    var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, 'u': 3, '^': 4 };
    t2.forEach(function (k) {
      if (k.t === 'n' || k.t === 'x') out.push(k);
      else if (k.t === 'f') ops.push(k);
      else if (k.t === '(') ops.push(k);
      else if (k.t === ')') { while (ops.length && ops[ops.length - 1].t !== '(') out.push(ops.pop()); ops.pop(); if (ops.length && ops[ops.length - 1].t === 'f') out.push(ops.pop()); }
      else {
        var op = k.t;
        if (op === '-' && (!prev || (prev.t !== 'n' && prev.t !== 'x' && prev.t !== ')'))) op = 'u';
        else if (op === '+' && (!prev || (prev.t !== 'n' && prev.t !== 'x' && prev.t !== ')'))) { prev = k; return; }
        while (ops.length) {
          var top = ops[ops.length - 1]; if (top.t === '(' || top.t === 'f') break;
          if ((op !== '^' && op !== 'u' && PREC[top.t] >= PREC[op]) || (op === '^' && PREC[top.t] > PREC[op])) out.push(ops.pop()); else break;
        }
        ops.push({ t: op });
      }
      prev = k;
    });
    while (ops.length) out.push(ops.pop());
    return function (x) {
      var st = [];
      for (var q = 0; q < out.length; q++) {
        var k = out[q];
        if (k.t === 'n') st.push(k.v); else if (k.t === 'x') st.push(x);
        else if (k.t === 'f') st.push(FN[k.v](st.pop()));
        else if (k.t === 'u') st.push(-st.pop());
        else { var b = st.pop(), a = st.pop(); st.push(k.t === '+' ? a + b : k.t === '-' ? a - b : k.t === '*' ? a * b : k.t === '/' ? a / b : Math.pow(a, b)); }
      }
      return st.length === 1 ? st[0] : NaN;
    };
  }
  function ticks(min, max, n) {
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / n))), err = n / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    var r = [], v = Math.ceil(min / step) * step; for (; v <= max + 1e-9; v += step) r.push(Math.round(v / step) * step); return r;
  }
  function fmt(v) { var a = Math.abs(v); return a >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '') + ' M' : a >= 1e4 ? Math.round(v).toLocaleString('es-CO') : (Math.round(v * 100) / 100).toLocaleString('es-CO'); }
  var grafN = 0;
  function grafica(d) {
    var clipId = 'srclip' + (++grafN), k = caja('grafica', d.titulo), W = 640, H = 380, P = { l: 58, r: 18, t: 18, b: 44 };
    var series = [], x0, x1;
    (d.funciones || []).forEach(function (f, i) { try { series.push({ et: f.etiqueta || f.expr, f: compilar(f.expr), c: (/^#[0-9a-f]{3,8}$/i.test(f.color || '') ? f.color : SERIE[i % SERIE.length]) }); } catch (e) { series.push({ et: (f.etiqueta || f.expr) + ' (no se pudo graficar)', err: true, c: '#999' }); } });
    (d.series || []).forEach(function (s, i) { series.push({ et: s.etiqueta, datos: (s.datos || []).map(function (p) { return Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [Number(p.x), Number(p.y)]; }), c: SERIE[(i + (d.funciones || []).length) % SERIE.length] }); });
    var xs = []; series.forEach(function (s) { (s.datos || []).forEach(function (p) { xs.push(p[0]); }); });
    if (Array.isArray(d.x) && d.x.length === 2) { x0 = Number(d.x[0]); x1 = Number(d.x[1]); }
    else if (xs.length) { x0 = Math.min.apply(null, xs); x1 = Math.max.apply(null, xs); } else { x0 = -10; x1 = 10; }
    if (!(x1 > x0)) { x1 = x0 + 1; }
    var N = 400, ys = [];
    series.forEach(function (s) {
      if (s.f) { s.pts = []; for (var i = 0; i <= N; i++) { var x = x0 + (x1 - x0) * i / N, y = s.f(x); s.pts.push([x, isFinite(y) ? y : NaN]); if (isFinite(y)) ys.push(y); } }
      if (s.datos) s.datos.forEach(function (p) { if (isFinite(p[1])) ys.push(p[1]); });
    });
    (d.puntos || []).forEach(function (p) { ys.push(Number(p.y)); });
    ys.sort(function (a, b) { return a - b; });
    var y0, y1;
    if (Array.isArray(d.y) && d.y.length === 2) { y0 = Number(d.y[0]); y1 = Number(d.y[1]); }
    else { y0 = ys.length ? ys[Math.floor(ys.length * .02)] : -10; y1 = ys.length ? ys[Math.ceil(ys.length * .98) - 1] : 10; var pad = (y1 - y0) * .08 || 1; y0 -= pad; y1 += pad; if (y0 > 0 && y0 < (y1 - y0) * .5) y0 = 0; }
    var X = function (v) { return P.l + (v - x0) / (x1 - x0) * (W - P.l - P.r); }, Y = function (v) { return H - P.b - (v - y0) / (y1 - y0) * (H - P.t - P.b); };
    var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(d.titulo || 'Gráfica') + '"><rect width="' + W + '" height="' + H + '" fill="#fff"/>';
    ticks(x0, x1, 8).forEach(function (v) { g += '<line x1="' + X(v) + '" y1="' + P.t + '" x2="' + X(v) + '" y2="' + (H - P.b) + '" stroke="#EEF2F8"/><text x="' + X(v) + '" y="' + (H - P.b + 18) + '" font-size="12" text-anchor="middle" fill="#4B5A70">' + fmt(v) + '</text>'; });
    ticks(y0, y1, 7).forEach(function (v) { g += '<line x1="' + P.l + '" y1="' + Y(v) + '" x2="' + (W - P.r) + '" y2="' + Y(v) + '" stroke="#EEF2F8"/><text x="' + (P.l - 6) + '" y="' + (Y(v) + 4) + '" font-size="12" text-anchor="end" fill="#4B5A70">' + fmt(v) + '</text>'; });
    if (x0 < 0 && x1 > 0) g += '<line x1="' + X(0) + '" y1="' + P.t + '" x2="' + X(0) + '" y2="' + (H - P.b) + '" stroke="#1F1D1A" stroke-width="1.5"/>';
    if (y0 < 0 && y1 > 0) g += '<line x1="' + P.l + '" y1="' + Y(0) + '" x2="' + (W - P.r) + '" y2="' + Y(0) + '" stroke="#1F1D1A" stroke-width="1.5"/>';
    g += '<defs><clipPath id="' + clipId + '"><rect x="' + P.l + '" y="' + P.t + '" width="' + (W - P.l - P.r) + '" height="' + (H - P.t - P.b) + '"/></clipPath></defs><g clip-path="url(#' + clipId + ')">';
    series.forEach(function (s) {
      var pts = s.pts || s.datos; if (!pts) return;
      var dpath = '', pen = false;
      pts.forEach(function (p) { if (!isFinite(p[1]) || p[1] > y1 + (y1 - y0) * 3 || p[1] < y0 - (y1 - y0) * 3) { pen = false; return; } dpath += (pen ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); pen = true; });
      g += '<path d="' + dpath + '" fill="none" stroke="' + s.c + '" stroke-width="3" stroke-linejoin="round"/>';
      if (s.datos) s.datos.forEach(function (p) { g += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="4.5" fill="' + s.c + '" stroke="#fff" stroke-width="2"/>'; });
    });
    (d.puntos || []).forEach(function (p) { g += '<circle cx="' + X(+p.x) + '" cy="' + Y(+p.y) + '" r="6" fill="#FF8A00" stroke="#fff" stroke-width="2"/><text x="' + (X(+p.x) + 9) + '" y="' + (Y(+p.y) - 9) + '" font-size="13" font-weight="700" fill="#073B7A">' + esc(p.etiqueta || ('(' + fmt(+p.x) + ', ' + fmt(+p.y) + ')')) + '</text>'; });
    g += '</g><line class="sr-cx" y1="' + P.t + '" y2="' + (H - P.b) + '" stroke="#FF8A00" stroke-dasharray="4 4" visibility="hidden"/>';
    if (d.ejeX) g += '<text x="' + (W - P.r) + '" y="' + (H - 6) + '" font-size="13" text-anchor="end" font-weight="700" fill="#073B7A">' + esc(d.ejeX) + '</text>';
    if (d.ejeY) g += '<text x="14" y="' + P.t + '" font-size="13" font-weight="700" fill="#073B7A" transform="rotate(-90 14 ' + (P.t + 60) + ')">' + esc(d.ejeY) + '</text>';
    g += '</svg>';
    var wrap = el('div', 'sr-graf', g + '<div class="sr-read"></div>'); k.body.appendChild(wrap);
    var svg = wrap.querySelector('svg'), read = wrap.querySelector('.sr-read'), cx = wrap.querySelector('.sr-cx');
    svg.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W; if (px < P.l || px > W - P.r) { read.style.display = 'none'; cx.setAttribute('visibility', 'hidden'); return; }
      var x = x0 + (px - P.l) / (W - P.l - P.r) * (x1 - x0);
      var txt = 'x = ' + fmt(x) + series.filter(function (s) { return s.f; }).map(function (s) { var y = s.f(x); return ' · ' + s.et + ' = ' + (isFinite(y) ? fmt(y) : '—'); }).join('');
      read.textContent = txt; read.style.display = 'block'; cx.setAttribute('x1', px); cx.setAttribute('x2', px); cx.setAttribute('visibility', 'visible');
    });
    svg.addEventListener('pointerleave', function () { read.style.display = 'none'; cx.setAttribute('visibility', 'hidden'); });
    k.body.appendChild(el('div', 'sr-leg', series.map(function (s) { return '<span><i style="background:' + s.c + '"></i>' + esc(s.et) + '</span>'; }).join('')));
    k.body.appendChild(el('p', 'sr-note', 'Pasa el cursor (o el dedo) sobre la gráfica para leer los valores. Ubica dónde corta los ejes, dónde crece o decrece y qué significa en el problema.'));
    k.body.appendChild(descargarSVG(svg, d.titulo));
    return k.box;
  }

  // ---------------------------------------------------------------- paso a paso / detecta el error
  function pasos(d) {
    var k = caja('pasos', d.titulo), lista = d.pasos || [], hayError = lista.some(function (p) { return p.error; });
    var ol = el('ol', 'sr-steps' + (hayError ? ' pick' : ''));
    lista.forEach(function (p, i) { var li = el('li', '', '<b>' + esc(p.paso) + '</b>' + (p.explicacion ? '<span>' + esc(p.explicacion) + '</span>' : '')); li.dataset.i = i; ol.appendChild(li); });
    if (hayError) {
      k.body.appendChild(el('p', '', '<strong>Reto:</strong> uno de estos pasos tiene un error. Tócalo cuando lo encuentres.'));
      var fb = el('div', 'sr-note');
      ol.addEventListener('click', function (e) {
        var li = e.target.closest('li'); if (!li || ol.dataset.fin) return;
        var p = lista[+li.dataset.i];
        if (p.error) { li.className = 'bad'; li.insertAdjacentHTML('beforeend', '<div class="sr-fix"><strong>¡Lo encontraste!</strong> ' + esc(p.correccion || '') + '</div>'); ol.dataset.fin = 1; fb.textContent = 'Explica con tus palabras por qué ese paso no es válido.'; }
        else { li.className = 'good'; fb.textContent = 'Ese paso es correcto. Revisa cada operación con calma y sigue buscando.'; }
      });
      k.body.appendChild(ol); k.body.appendChild(fb);
      var ver = el('button', 'srb alt', 'Mostrar el error'); ver.type = 'button';
      ver.onclick = function () { lista.forEach(function (p, i) { if (p.error && !ol.dataset.fin) ol.children[i].click(); }); }; k.body.appendChild(ver);
    } else k.body.appendChild(ol);
    return k.box;
  }

  // ---------------------------------------------------------------- flashcards + repetición espaciada (Leitner)
  var KEY_REP = 'sabi_repasos_v1', DIAS = [0, 1, 3, 7, 16, 35];
  function repasos() { return leer(KEY_REP, []); }
  function guardarTarjetas(titulo, tarjetas) {
    var r = repasos(), hoy = Date.now();
    tarjetas.forEach(function (t) { if (!r.some(function (x) { return x.frente === t.frente; })) r.push({ tema: titulo, frente: t.frente, reverso: t.reverso, caja: 0, prox: hoy }); });
    guardar(KEY_REP, r.slice(-400)); return r.length;
  }
  function calificar(frente, sabia) {
    var r = repasos(), t = r.find(function (x) { return x.frente === frente; }); if (!t) return;
    t.caja = sabia ? Math.min(t.caja + 1, DIAS.length - 1) : 0; t.prox = Date.now() + DIAS[t.caja] * 864e5; guardar(KEY_REP, r);
  }
  function pendientes() { var n = Date.now(); return repasos().filter(function (t) { return t.prox <= n; }); }
  function mazo(tarjetas, titulo, registrar) {
    var wrap = el('div'), i = 0, sabidas = 0;
    function pinta() {
      if (i >= tarjetas.length) { wrap.innerHTML = '<p><strong>¡Terminaste!</strong> Sabías ' + sabidas + ' de ' + tarjetas.length + '. Las que fallaste volverán pronto: así la memoria se vuelve duradera.</p>'; return; }
      var t = tarjetas[i];
      wrap.innerHTML = '<div class="sr-prog"><i style="width:' + (i / tarjetas.length * 100) + '%"></i></div><p class="sr-note">Tarjeta ' + (i + 1) + ' de ' + tarjetas.length + ' · primero intenta recordar, luego voltea.</p>' +
        '<div class="sr-card" tabindex="0" role="button" aria-label="Voltear tarjeta"><div class="sr-in"><div class="sr-f">' + esc(t.frente) + '</div><div class="sr-r">' + esc(t.reverso) + '</div></div></div>' +
        '<button type="button" class="srb" data-s="1">Lo sabía</button><button type="button" class="srb nar" data-s="0">Debo repasarla</button>';
      var card = wrap.querySelector('.sr-card');
      card.onclick = function () { card.classList.toggle('on'); };
      card.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.classList.toggle('on'); } };
      wrap.querySelectorAll('button[data-s]').forEach(function (b) { b.onclick = function () { var s = b.dataset.s === '1'; if (s) sabidas++; if (registrar) calificar(t.frente, s); i++; pinta(); }; });
    }
    pinta(); return wrap;
  }
  function flashcards(d) {
    var k = caja('flashcards', d.titulo), ts = (d.tarjetas || []).filter(function (t) { return t.frente && t.reverso; });
    k.body.appendChild(mazo(ts, d.titulo, false));
    var g = el('button', 'srb alt', 'Guardar en Mis repasos'); g.type = 'button';
    g.onclick = function () { guardarTarjetas(d.titulo || 'Repaso', ts); g.textContent = 'Guardadas: SABI te las recordará en 1, 3, 7, 16 y 35 días'; g.disabled = true; document.dispatchEvent(new CustomEvent('sabi:repasos')); };
    k.body.appendChild(g); return k.box;
  }

  // ---------------------------------------------------------------- quiz
  function quiz(d) {
    var k = caja('quiz', d.titulo), ps = d.preguntas || [], aciertos = 0, resp = 0;
    var score = el('p', 'sr-note', 'Responde cada pregunta; verás la explicación al instante.');
    ps.forEach(function (p, i) {
      var q = el('div', 'sr-q', '<h4>' + (i + 1) + '. ' + esc(p.enunciado) + '</h4>');
      (p.opciones || []).forEach(function (o, j) {
        var b = el('button', 'sr-op', '<b>' + 'ABCDEF'[j] + '.</b> ' + esc(String(o).replace(/^[A-F][\).]\s*/, ''))); b.type = 'button';
        b.onclick = function () {
          if (q.dataset.ok) return; q.dataset.ok = 1; resp++;
          var bien = j === Number(p.correcta); if (bien) aciertos++;
          b.classList.add(bien ? 'ok' : 'no'); if (!bien && q.querySelectorAll('.sr-op')[p.correcta]) q.querySelectorAll('.sr-op')[p.correcta].classList.add('ok');
          q.appendChild(el('div', 'sr-exp', '<strong>' + (bien ? 'Correcto.' : 'Revisa tu razonamiento.') + '</strong> ' + esc(p.explicacion || '')));
          score.innerHTML = '<strong>Puntaje: ' + aciertos + ' de ' + resp + '</strong>' + (resp === ps.length ? (aciertos === ps.length ? ' · ¡Dominio total!' : ' · Repasa las explicaciones y vuelve a intentarlo mañana.') : '');
        };
        q.appendChild(b);
      });
      k.body.appendChild(q);
    });
    k.body.appendChild(score); return k.box;
  }

  // ---------------------------------------------------------------- línea de tiempo, 5W1H, síntesis
  function timeline(d) { var k = caja('timeline', d.titulo); k.body.appendChild(el('div', 'sr-tl', (d.eventos || []).map(function (e) { return '<div><b>' + esc(e.fecha) + '</b><strong>' + esc(e.titulo) + '</strong>' + esc(e.detalle || '') + '</div>'; }).join(''))); return k.box; }
  function w5h1(d) {
    var k = caja('5w1h', d.tema || d.titulo), campos = [['que', '¿Qué?'], ['quien', '¿Quién?'], ['cuando', '¿Cuándo?'], ['donde', '¿Dónde?'], ['porque', '¿Por qué?'], ['como', '¿Cómo?']];
    k.body.appendChild(el('div', 'sr-grid', campos.filter(function (c) { return d[c[0]]; }).map(function (c) { return '<div class="sr-cell"><h5>' + c[1] + '</h5>' + esc(d[c[0]]) + '</div>'; }).join(''))); return k.box;
  }
  function sintesis(d) {
    var k = caja('sintesis', d.titulo || 'Síntesis para dominar el tema');
    var q = [['memorizar', 'Debo memorizar', '#EEF5FF', C.azul], ['comprender', 'Debo comprender', '#EEF9F2', C.verde], ['ejecutar', 'Debo saber hacer', '#FFF7EF', C.naranja], ['decidir', 'Debo saber decidir', '#F6F2FF', C.morado]];
    k.body.appendChild(el('div', 'sr-quad', q.map(function (c) { var l = [].concat(d[c[0]] || []); return l.length ? '<div style="background:' + c[2] + '"><h5 style="color:' + c[3] + '">' + c[1] + '</h5><ul>' + l.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' : ''; }).join('')));
    if (d.repaso) k.body.appendChild(el('p', 'sr-note', '<strong>Plan de repaso:</strong> ' + esc(d.repaso)));
    return k.box;
  }

  // ---------------------------------------------------------------- sopa de letras
  function sopa(d) {
    var k = caja('sopa', d.titulo), palabras = (d.palabras || []).map(norm).filter(function (w) { return w.length >= 3 && w.length <= 14; }).slice(0, 12);
    var n = Math.min(15, Math.max(10, palabras.reduce(function (m, w) { return Math.max(m, w.length); }, 0) + 2));
    var DIR = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1]], G = [], puestas = [];
    for (var r = 0; r < n; r++) G.push(new Array(n).fill(''));
    palabras.sort(function (a, b) { return b.length - a.length; }).forEach(function (w) {
      for (var t = 0; t < 300; t++) {
        var dr = DIR[Math.floor(Math.random() * DIR.length)], r0 = Math.floor(Math.random() * n), c0 = Math.floor(Math.random() * n), ok = true;
        for (var i = 0; i < w.length; i++) { var rr = r0 + dr[0] * i, cc = c0 + dr[1] * i; if (rr < 0 || cc < 0 || rr >= n || cc >= n || (G[rr][cc] && G[rr][cc] !== w[i])) { ok = false; break; } }
        if (!ok) continue;
        var celdas = []; for (i = 0; i < w.length; i++) { G[r0 + dr[0] * i][c0 + dr[1] * i] = w[i]; celdas.push((r0 + dr[0] * i) + ',' + (c0 + dr[1] * i)); }
        puestas.push({ w: w, celdas: celdas }); return;
      }
    });
    var AB = 'ABCDEFGHIJKLMNOPRSTUVZ';
    var grid = el('div', 'sr-sopa'); grid.style.gridTemplateColumns = 'repeat(' + n + ',1fr)';
    for (r = 0; r < n; r++) for (var c = 0; c < n; c++) { var s = el('span', '', G[r][c] || AB[Math.floor(Math.random() * AB.length)]); s.dataset.k = r + ',' + c; grid.appendChild(s); }
    var lista = el('div', 'sr-words', puestas.map(function (p) { return '<span data-w="' + p.w + '">' + p.w + '</span>'; }).join(''));
    var ini = null, hallados = 0, msg = el('p', 'sr-note', 'Toca la primera y la última letra de cada palabra.');
    grid.addEventListener('click', function (e) {
      var s = e.target.closest('span'); if (!s) return;
      if (!ini) { ini = s; s.classList.add('sel'); return; }
      var a = ini.dataset.k.split(',').map(Number), b = s.dataset.k.split(',').map(Number); ini.classList.remove('sel'); ini = null;
      var dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]), len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) + 1;
      if (!(a[0] === b[0] || a[1] === b[1] || Math.abs(b[0] - a[0]) === Math.abs(b[1] - a[1]))) return;
      var ks = []; for (var i = 0; i < len; i++) ks.push((a[0] + dr * i) + ',' + (a[1] + dc * i));
      var hit = puestas.find(function (p) { return !p.ok && (p.celdas.join('|') === ks.join('|') || p.celdas.slice().reverse().join('|') === ks.join('|')); });
      if (hit) { hit.ok = 1; hallados++; ks.forEach(function (kk) { grid.querySelector('[data-k="' + kk + '"]').classList.add('hit'); }); lista.querySelector('[data-w="' + hit.w + '"]').classList.add('hit'); msg.textContent = hallados === puestas.length ? '¡Encontraste todas! Ahora explica qué significa cada una.' : '¡Bien! Llevas ' + hallados + ' de ' + puestas.length + '.'; }
    });
    k.body.appendChild(grid); k.body.appendChild(lista); k.body.appendChild(msg);
    if (d.pistas && d.pistas.length) { var pv = el('details', '', '<summary><strong>Pistas: ¿qué significa cada palabra?</strong></summary><ol>' + d.pistas.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>'); k.body.appendChild(pv); }
    return k.box;
  }

  // ---------------------------------------------------------------- crucigrama (generador por cruces)
  function armarCrucigrama(entradas) {
    var ws = entradas.map(function (e) { return { w: norm(e.palabra), pista: e.pista }; }).filter(function (e) { return e.w.length >= 2 && e.w.length <= 15; }).sort(function (a, b) { return b.w.length - a.w.length; });
    if (!ws.length) return null;
    var M = {}, pl = [], at = function (r, c) { return M[r + ',' + c]; };
    function cabe(w, r, c, h) {
      var cruces = 0;
      if (at(r - (h ? 0 : 1), c - (h ? 1 : 0)) || at(r + (h ? 0 : w.length), c + (h ? w.length : 0))) return -1;
      for (var i = 0; i < w.length; i++) {
        var rr = r + (h ? 0 : i), cc = c + (h ? i : 0), v = at(rr, cc);
        if (v) { if (v !== w[i]) return -1; cruces++; }
        else if (h ? (at(rr - 1, cc) || at(rr + 1, cc)) : (at(rr, cc - 1) || at(rr, cc + 1))) return -1;
      }
      return cruces;
    }
    function poner(e, r, c, h) { for (var i = 0; i < e.w.length; i++) M[(r + (h ? 0 : i)) + ',' + (c + (h ? i : 0))] = e.w[i]; pl.push({ e: e, r: r, c: c, h: h }); }
    poner(ws[0], 0, 0, true);
    var resto = ws.slice(1), fuera = [];
    for (var vuelta = 0; vuelta < 2; vuelta++) {
      var pend = [];
      resto.forEach(function (e) {
        var mejor = null;
        pl.forEach(function (p) {
          for (var i = 0; i < p.e.w.length; i++) for (var j = 0; j < e.w.length; j++) {
            if (p.e.w[i] !== e.w[j]) continue;
            var h = !p.h, r = p.h ? p.r - j : p.r + i, c = p.h ? p.c + i : p.c - j, x = cabe(e.w, r, c, h);
            if (x > 0 && (!mejor || x > mejor.x)) mejor = { r: r, c: c, h: h, x: x };
          }
        });
        if (mejor) poner(e, mejor.r, mejor.c, mejor.h); else pend.push(e);
      });
      resto = pend;
    }
    fuera = resto;
    var r0 = Infinity, c0 = Infinity, r1 = -Infinity, c1 = -Infinity;
    Object.keys(M).forEach(function (k) { var a = k.split(',').map(Number); r0 = Math.min(r0, a[0]); r1 = Math.max(r1, a[0]); c0 = Math.min(c0, a[1]); c1 = Math.max(c1, a[1]); });
    pl.sort(function (a, b) { return (a.r - b.r) || (a.c - b.c); });
    var num = {}, n = 0; pl.forEach(function (p) { var k = p.r + ',' + p.c; if (!num[k]) num[k] = ++n; p.n = num[k]; });
    return { M: M, pl: pl, fuera: fuera, r0: r0, c0: c0, filas: r1 - r0 + 1, cols: c1 - c0 + 1, num: num };
  }
  function crucigrama(d) {
    var k = caja('crucigrama', d.titulo), cw = armarCrucigrama(d.entradas || []);
    if (!cw) { k.body.innerHTML = '<p class="sr-note">No hubo palabras suficientes para armar el crucigrama.</p>'; return k.box; }
    var g = el('div', 'sr-cw'); g.style.gridTemplateColumns = 'repeat(' + cw.cols + ',1fr)';
    for (var r = 0; r < cw.filas; r++) for (var c = 0; c < cw.cols; c++) {
      var key = (r + cw.r0) + ',' + (c + cw.c0), v = cw.M[key], cell = el('div', v ? 'c' : '');
      if (v) { cell.dataset.k = key; cell.innerHTML = (cw.num[key] ? '<sup>' + cw.num[key] + '</sup>' : '') + '<input maxlength="1" aria-label="casilla" autocomplete="off" autocapitalize="characters">'; }
      g.appendChild(cell);
    }
    g.addEventListener('input', function (e) {
      var inp = e.target; inp.value = norm(inp.value).slice(-1);
      if (!inp.value) return;
      var cells = [].slice.call(g.querySelectorAll('div.c')), i = cells.indexOf(inp.parentNode);
      if (cells[i + 1]) cells[i + 1].querySelector('input').focus();
    });
    var h = cw.pl.filter(function (p) { return p.h; }), v2 = cw.pl.filter(function (p) { return !p.h; });
    var li = function (p) { return '<li><b>' + p.n + '.</b> ' + esc(p.e.pista) + ' <span class="sr-note">(' + p.e.w.length + ')</span></li>'; };
    k.body.appendChild(g);
    k.body.appendChild(el('div', 'sr-clues', '<div><h5>Horizontales</h5><ol>' + h.map(li).join('') + '</ol></div><div><h5>Verticales</h5><ol>' + v2.map(li).join('') + '</ol></div>'));
    var res = el('p', 'sr-note');
    var chk = el('button', 'srb', 'Comprobar'); chk.type = 'button';
    chk.onclick = function () { var bien = 0, tot = 0; g.querySelectorAll('div.c').forEach(function (cl) { tot++; var ok = cl.querySelector('input').value === cw.M[cl.dataset.k]; cl.classList.toggle('ok', ok); cl.classList.toggle('no', !ok); if (ok) bien++; }); res.textContent = bien === tot ? '¡Crucigrama completo! Excelente.' : 'Llevas ' + bien + ' de ' + tot + ' letras correctas. Las rojas necesitan otra mirada.'; };
    var sol = el('button', 'srb alt', 'Ver solución'); sol.type = 'button';
    sol.onclick = function () { g.querySelectorAll('div.c').forEach(function (cl) { cl.querySelector('input').value = cw.M[cl.dataset.k]; }); };
    k.body.appendChild(chk); k.body.appendChild(sol); k.body.appendChild(res);
    if (cw.fuera.length) k.body.appendChild(el('p', 'sr-note', '<strong>Palabras extra para pensar:</strong> ' + cw.fuera.map(function (e) { return esc(e.pista) + ' (' + e.w.length + ' letras)'; }).join(' · ')));
    return k.box;
  }

  // ---------------------------------------------------------------- cómic
  function avatar(i) {
    var piel = ['#F2C6A0', '#C68E5E', '#8D5A3B', '#E8B48A'][i % 4], ropa = [C.azul, C.naranja, C.verde, C.morado][i % 4], pelo = ['#2B1B0E', '#5A3A1A', '#111', '#7A4B21'][i % 4];
    return '<svg viewBox="0 0 44 54" aria-hidden="true"><path d="M6 54 C6 40 38 40 38 54Z" fill="' + ropa + '"/><circle cx="22" cy="22" r="14" fill="' + piel + '"/><path d="M8 20 C8 6 36 6 36 20 C30 13 16 13 8 20Z" fill="' + pelo + '"/><circle cx="17" cy="23" r="2" fill="#111"/><circle cx="27" cy="23" r="2" fill="#111"/><path d="M17 29 Q22 33 27 29" stroke="#111" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
  }
  function comic(d) {
    var k = caja('comic', d.titulo), per = d.personajes || [];
    var idx = function (n) { var i = per.indexOf(n); if (i < 0) { per.push(n); i = per.length - 1; } return i; };
    k.body.appendChild(el('div', 'sr-comic', (d.vinetas || []).map(function (v, i) {
      return '<div class="sr-panel"><span class="sr-esc">' + (i + 1) + ' · ' + esc(v.escena || '') + '</span>' + (v.dialogos || []).map(function (dl) { return '<div class="sr-bub">' + avatar(idx(dl.personaje)) + '<p><em>' + esc(dl.personaje) + '</em>' + esc(dl.texto) + '</p></div>'; }).join('') + '</div>';
    }).join('')));
    k.body.appendChild(el('p', 'sr-note', 'Después de leer: ¿qué decisión tomarías tú en la última viñeta y por qué?'));
    return k.box;
  }

  // ---------------------------------------------------------------- sketchnotes
  var ICONOS = {
    idea: '<svg viewBox="0 0 40 40"><path d="M20 4a11 11 0 0 0-6 20v5h12v-5A11 11 0 0 0 20 4z" fill="#FFD43B" stroke="#073B7A" stroke-width="2"/><path d="M15 33h10M16 37h8" stroke="#073B7A" stroke-width="2.5" stroke-linecap="round"/></svg>',
    dato: '<svg viewBox="0 0 40 40"><rect x="5" y="22" width="7" height="13" fill="#064FAE"/><rect x="16" y="14" width="7" height="21" fill="#FF8A00"/><rect x="27" y="6" width="7" height="29" fill="#108A4F"/></svg>',
    alerta: '<svg viewBox="0 0 40 40"><path d="M20 4 37 35H3Z" fill="#FFF3B0" stroke="#C0392B" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 15v9" stroke="#C0392B" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="29" r="2" fill="#C0392B"/></svg>',
    ejemplo: '<svg viewBox="0 0 40 40"><path d="M20 4l4.5 10 10.5 1-8 7 2.5 11L20 27l-9.5 6 2.5-11-8-7 10.5-1z" fill="#FF8A00" stroke="#073B7A" stroke-width="1.5"/></svg>',
    pregunta: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#EEF5FF" stroke="#064FAE" stroke-width="2.5"/><path d="M15 15a5 5 0 1 1 7 4.6c-1.5.7-2 1.6-2 3.4" stroke="#064FAE" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="20" cy="29" r="2" fill="#064FAE"/></svg>',
    meta: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#fff" stroke="#C0392B" stroke-width="3"/><circle cx="20" cy="20" r="10" fill="#fff" stroke="#C0392B" stroke-width="3"/><circle cx="20" cy="20" r="4" fill="#C0392B"/></svg>'
  };
  function sketchnote(d) { var k = caja('sketchnote', d.titulo); k.body.appendChild(el('div', 'sr-sk', (d.ideas || []).map(function (x) { return '<div>' + (ICONOS[x.icono] || ICONOS.idea) + '<span>' + esc(x.texto) + '</span></div>'; }).join(''))); return k.box; }

  // ---------------------------------------------------------------- modo investigador
  function fuentes(d) {
    var k = caja('fuentes', 'Investiga con fuentes confiables');
    var pals = d.palabras_clave || [], links = window.SabiDots ? SabiDots.enlacesInvestigacion(pals, d.keywords_en) : [];
    if (d.pregunta) k.body.appendChild(el('p', '', '<strong>Tu pregunta de investigación:</strong> ' + esc(d.pregunta)));
    if (pals.length) k.body.appendChild(el('div', 'sr-chips', pals.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('')));
    k.body.appendChild(el('div', 'sr-links', links.map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.nombre) + '<small>' + esc(l.tipo) + '</small></a>'; }).join('')));
    if (d.tipos_de_fuente && d.tipos_de_fuente.length) k.body.appendChild(el('div', '', '<p><strong>Qué tipo de fuentes buscar:</strong></p><ul>' + d.tipos_de_fuente.map(function (t) { return '<li><b>' + esc(t.tipo) + ':</b> ' + esc(t.por_que) + '</li>'; }).join('') + '</ul>'));
    k.body.appendChild(el('div', 'sr-chk', '<p><strong>Antes de usar una fuente, verifica (prueba CRAAP):</strong></p>' + ['Actualidad: ¿tiene fecha y es reciente para mi tema?', 'Relevancia: ¿responde mi pregunta?', 'Autoridad: ¿quién lo escribe y qué lo hace experto?', 'Exactitud: ¿muestra evidencia y se puede contrastar con otra fuente?', 'Propósito: ¿informa, vende o convence?'].map(function (t) { return '<label><input type="checkbox"> ' + t + '</label>'; }).join('')));
    var apa = el('div', '', '<p><strong>Generador de cita APA 7:</strong></p><div class="sr-apa"><input placeholder="Apellido, Inicial. (autor u organización)" data-a="autor"><input placeholder="Año" data-a="anio"><input placeholder="Título" data-a="titulo"><input placeholder="Sitio o revista" data-a="sitio"><input placeholder="URL" data-a="url"></div><div class="sr-cita" aria-live="polite"></div>');
    var cita = apa.querySelector('.sr-cita');
    apa.addEventListener('input', function () {
      var v = {}; apa.querySelectorAll('input').forEach(function (i) { v[i.dataset.a] = i.value.trim(); });
      cita.innerHTML = v.autor || v.titulo ? esc(v.autor || 'Autor') + ' (' + esc(v.anio || 's. f.') + '). <i>' + esc(v.titulo || 'Título') + '</i>' + (v.sitio ? '. ' + esc(v.sitio) : '') + (v.url ? '. ' + esc(v.url) : '') : '';
    });
    k.body.appendChild(apa);
    k.body.appendChild(el('p', 'sr-note', 'SABI te da la ruta; tú lees, comparas al menos tres fuentes y sacas tus propias conclusiones. Wikipedia sirve para empezar, no para citar.'));
    return k.box;
  }

  // ---------------------------------------------------------------- proyecto (§5)
  function proyecto(d) {
    var k = caja('proyecto', d.titulo), cop = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
    var sec = function (n, t, h) { return h ? '<div class="sr-sec"><h5><span>' + n + '</span>' + t + '</h5>' + h + '</div>' : ''; };
    var lista = function (a) { return a && a.length ? '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; };
    var pres = d.presupuesto || [], tot = pres.reduce(function (s, p) { return s + (Number(p.valor) || 0); }, 0);
    var tabla = pres.length ? '<table><tr><th>Rubro</th><th>Valor (COP)</th></tr>' + pres.map(function (p) { return '<tr><td>' + esc(p.rubro) + '</td><td>' + cop(p.valor) + '</td></tr>'; }).join('') + '<tr class="tot"><td>Total</td><td>' + cop(tot) + '</td></tr></table>' : '';
    var crono = d.cronograma || [], maxS = 1;
    crono.forEach(function (f) { var m = String(f.semanas || '').match(/\d+/g); if (m) maxS = Math.max(maxS, +m[m.length - 1]); });
    var gantt = crono.length ? '<div class="sr-gantt">' + crono.map(function (f) { var m = String(f.semanas || '').match(/\d+/g) || [1, 1], a = +m[0], b = +m[m.length - 1]; return '<div><span>' + esc(f.fase) + ' <small class="sr-note">(sem. ' + esc(f.semanas) + ')</small></span><span><i style="margin-left:' + ((a - 1) / maxS * 100) + '%;width:' + Math.max(4, (b - a + 1) / maxS * 100) + '%"></i></span></div>'; }).join('') + '</div>' : '';
    k.body.innerHTML =
      sec(1, 'Título e impacto social y económico', '<p><strong>' + esc(d.titulo) + '</strong></p><p>' + esc(d.impacto || '') + '</p>') +
      sec(2, 'Planteamiento del problema (ODS + contexto local)', '<p>' + esc(d.problema || '') + '</p>') +
      sec(3, 'Puntal ético y valores Sabicentec', '<p>' + esc(d.etica || '') + '</p>') +
      sec(4, 'Objetivos SMART', '<p><strong>General:</strong> ' + esc(d.objetivo_general || '') + '</p>' + lista(d.objetivos_especificos)) +
      sec(5, 'Metodología STEAM y modelo financiero', '<p>' + esc(d.metodologia || '') + '</p>' + (d.modelo_financiero ? '<p><strong>Modelo financiero:</strong> ' + esc(d.modelo_financiero) + '</p>' : '')) +
      sec(6, 'Presupuesto, cronograma e integración SENA', tabla + gantt + (d.sena ? '<p><strong>SENA:</strong> ' + esc(d.sena) + '</p>' : '')) +
      sec(7, 'Resultados esperados e indicadores de impacto', lista(d.indicadores));
    var cp = el('button', 'srb', 'Copiar proyecto'); cp.type = 'button';
    cp.onclick = function () { var t = k.body.innerText.replace('Copiar proyecto', '').trim(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { cp.textContent = 'Copiado'; }, function () { cp.textContent = 'Selecciona y copia el texto'; }); };
    var pr = el('button', 'srb alt', 'Imprimir o guardar PDF'); pr.type = 'button'; pr.onclick = function () { window.print(); };
    k.body.appendChild(cp); k.body.appendChild(pr);
    return k.box;
  }

  // ---------------------------------------------------------------- mermaid (diagramas, mapas mentales, flujos)
  var mermaidListo = null, mmN = 0;
  function cargarMermaid() {
    if (mermaidListo) return mermaidListo;
    mermaidListo = new Promise(function (ok, no) {
      if (window.mermaid) return ok(window.mermaid);
      var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js'; s.async = true;
      s.onload = function () { window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base', themeVariables: { primaryColor: '#EEF5FF', primaryBorderColor: '#064FAE', primaryTextColor: '#073B7A', lineColor: '#064FAE', secondaryColor: '#FFF7EF', tertiaryColor: '#F5F8FD', fontFamily: 'Public Sans, system-ui, sans-serif', fontSize: '16px' } }); ok(window.mermaid); };
      s.onerror = no; document.head.appendChild(s);
    });
    return mermaidListo;
  }
  function limpiarMermaid(code) { return String(code).replace(/^\s*mermaid\s*\n/, '').replace(/[“”]/g, '"'); }
  function diagrama(code) {
    var tipo = /^\s*mindmap/m.test(code) ? 'Mapa mental' : /^\s*(flowchart|graph)/m.test(code) ? 'Diagrama de flujo' : /^\s*timeline/m.test(code) ? 'Línea de tiempo' : 'Diagrama';
    var k = caja('mermaid', tipo), w = el('div', 'sr-mm', '<p class="sr-note">Dibujando…</p>'); k.body.appendChild(w);
    cargarMermaid().then(function (m) { return m.render('srmm' + (++mmN) + Date.now(), limpiarMermaid(code)); })
      .then(function (r) { w.innerHTML = r.svg; var svg = w.querySelector('svg'); if (svg) { svg.style.maxHeight = '640px'; svg.style.margin = '0 auto'; k.body.appendChild(descargarSVG(svg, tipo)); } })
      .catch(function () { w.innerHTML = '<p class="sr-note">No se pudo dibujar el diagrama; este es su contenido:</p><pre>' + esc(code) + '</pre>'; });
    return k.box;
  }
  function codigo(code) { var k = caja('code', 'Código'); k.body.innerHTML = '<pre style="white-space:pre-wrap;background:#0f172a;color:#e5e7eb;padding:12px;border-radius:10px;font-size:14px;overflow-x:auto">' + esc(code) + '</pre>'; return k.box; }

  var RENDER = { grafica: grafica, pasos: pasos, flashcards: flashcards, quiz: quiz, timeline: timeline, '5w1h': w5h1, sopa: sopa, crucigrama: crucigrama, comic: comic, sketchnote: sketchnote, fuentes: fuentes, proyecto: proyecto, sintesis: sintesis };
  function crear(r) {
    try {
      if (r.kind === 'mermaid') return diagrama(r.code);
      if (r.kind === 'code') return codigo(r.code);
      var f = RENDER[String(r.data.tipo).toLowerCase()]; return f ? f(r.data) : null;
    } catch (e) { console.warn('SABI recurso', e); return null; }
  }
  function montar(contenedor, recursos) {
    estilos();
    contenedor.querySelectorAll('[data-sabirecurso]').forEach(function (ph) {
      var r = recursos[+ph.getAttribute('data-sabirecurso')], nodo = r && crear(r);
      if (nodo) ph.replaceWith(nodo); else ph.remove();
    });
  }

  window.SabiRecursos = { extraer: extraer, montar: montar, crear: crear, estilos: estilos, mazo: mazo, repasos: repasos, pendientes: pendientes, compilar: compilar, armarCrucigrama: armarCrucigrama };
})();
