/*!
 * SABI Fichas · AI CENTEC (Colegio CENTEC, Cali)
 * Generador infinito de fichas de matemáticas, alineado a los Estándares
 * Básicos de Competencias en Matemáticas del MEN (pensamiento numérico,
 * espacial, métrico, aleatorio y variacional).
 * Todo el contenido (enunciados, figuras SVG y respuestas) se construye por
 * código a partir de una semilla: la misma {grado, tipo, semilla} produce
 * siempre la misma ficha.
 * Script de navegador ES5, sin dependencias. Expone window.SabiFichas.
 */
(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. Azar con semilla
   * ------------------------------------------------------------------ */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function Rng(seed) {
    var f = mulberry32(seed);
    var r = {
      f: f,
      i: function (a, b) { return a + Math.floor(f() * (b - a + 1)); },
      p: function (arr) { return arr[Math.floor(f() * arr.length)]; },
      b: function (prob) { return f() < (prob == null ? 0.5 : prob); },
      s: function () { return f() < 0.5 ? -1 : 1; },
      sh: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
      },
      nz: function (a, b) { var v = 0; while (v === 0) v = r.i(a, b); return v; }
    };
    return r;
  }

  /* ------------------------------------------------------------------ *
   * 2. Utilidades numéricas y de formato (es-CO)
   * ------------------------------------------------------------------ */
  var MENOS = '−';
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
  function grupo(n) { // 12500 -> "12.500"
    var s = String(Math.abs(Math.round(n))), out = '';
    while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (n < 0 ? MENOS : '') + s + out;
  }
  function fmtN(x, dec) {
    if (dec == null) dec = 3;
    var p = Math.pow(10, dec);
    x = Math.round(x * p) / p;
    var neg = x < 0; x = Math.abs(x);
    var ent = Math.floor(x + 1e-9), fr = Math.round((x - ent) * p);
    if (fr >= p) { ent += 1; fr = 0; }
    var es = ent >= 10000 ? grupo(ent) : String(ent);
    var s = es;
    if (fr > 0) {
      var fs = String(fr); while (fs.length < dec) fs = '0' + fs;
      fs = fs.replace(/0+$/, '');
      s += ',' + fs;
    }
    return (neg && (ent > 0 || fr > 0) ? MENOS : '') + s;
  }
  function fmtM(x) { return '$' + grupo(Math.round(x)); }
  function sg(n) { return n < 0 ? MENOS + Math.abs(n) : String(n); }       // -3 -> −3
  function par(n) { return n < 0 ? '(' + MENOS + Math.abs(n) + ')' : String(n); } // -3 -> (−3)
  function r2(x) { return Math.round(x * 100) / 100; }

  // Fracciones
  function F(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function fAdd(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
  function fSub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
  function fMul(a, b) { return F(a.n * b.n, a.d * b.d); }
  function fDiv(a, b) { return F(a.n * b.d, a.d * b.n); }
  function fStr(a) { return a.d === 1 ? sg(a.n) : sg(a.n) + '/' + a.d; }
  function fVal(a) { return a.n / a.d; }
  function frH(n, d) { // fracción apilada en HTML
    if (d === 1) return sg(n);
    return (n < 0 ? MENOS : '') + '<span class="sf-frac"><span>' + Math.abs(n) + '</span><span>' + d + '</span></span>';
  }
  function fH(a) { return frH(a.n, a.d); }
  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function supTxt(n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); }

  // Polinomios: {exp: coef}
  function polyTxt(p, v, html) {
    v = v || 'x';
    var exps = Object.keys(p).map(Number).sort(function (a, b) { return b - a; });
    var s = '', first = true;
    exps.forEach(function (e) {
      var c = p[e]; if (!c) return;
      var a = Math.abs(c), sign = c < 0 ? MENOS : '+';
      var cs = (a === 1 && e !== 0) ? '' : fmtN(a);
      var vs = e === 0 ? '' : (e === 1 ? v : v + (html ? '<sup>' + e + '</sup>' : supTxt(e)));
      if (first) { s += (c < 0 ? MENOS : '') + cs + vs; first = false; }
      else s += ' ' + sign + ' ' + cs + vs;
    });
    return s || '0';
  }
  function polyDer(p) {
    var d = {};
    Object.keys(p).forEach(function (k) { var e = Number(k); if (e > 0 && p[k]) d[e - 1] = (d[e - 1] || 0) + p[k] * e; });
    return d;
  }
  function polyEval(p, x) {
    var s = 0; Object.keys(p).forEach(function (k) { s += p[k] * Math.pow(x, Number(k)); }); return s;
  }

  /* ------------------------------------------------------------------ *
   * 3. Revisión de respuestas
   * ------------------------------------------------------------------ */
  var SUPMAP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
  function sinAcentos(s) {
    if (s.normalize) return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i').replace(/[óò]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n');
  }
  function norm(s) {
    s = String(s == null ? '' : s).toLowerCase();
    s = s.replace(/[−–—]/g, '-');
    s = sinAcentos(s);
    s = s.replace(/\s+/g, '');
    return s;
  }
  function conRaices(s) {
    return s.replace(/(?:√|raiz|sqrt)\(?(\d+(?:[.,]\d+)?)\)?/g, function (m, n) {
      return Math.sqrt(parseFloat(n.replace(',', '.'))).toFixed(6);
    });
  }
  function decCands(t) {
    t = t.replace(/[.,]+$/, '');
    if (!t || t === '-') return [];
    var out = [];
    var neg = t.charAt(0) === '-'; var u = neg ? t.slice(1) : t;
    var sgn = neg ? -1 : 1;
    if (u.indexOf(',') >= 0 && u.indexOf('.') >= 0) {
      out.push(sgn * parseFloat(u.replace(/\./g, '').replace(',', '.')));
    } else if (u.indexOf(',') >= 0) {
      out.push(sgn * parseFloat(u.replace(/,/g, '.').replace(/\.(?=.*\.)/g, '')));
      if (/^\d{1,3}(,\d{3})+$/.test(u)) out.push(sgn * parseFloat(u.replace(/,/g, '')));
    } else if (u.indexOf('.') >= 0) {
      if (/^\d+\.\d+$/.test(u)) out.push(sgn * parseFloat(u));
      if (/^\d{1,3}(\.\d{3})+$/.test(u)) out.push(sgn * parseFloat(u.replace(/\./g, '')));
    } else out.push(sgn * parseFloat(u));
    return out.filter(function (v) { return isFinite(v); });
  }
  function tokCands(tok) {
    var parts = tok.split('/');
    if (parts.length === 2) {
      var a = decCands(parts[0]), b = decCands(parts[1]), out = [];
      a.forEach(function (x) { b.forEach(function (y) { if (y !== 0) out.push(x / y); }); });
      return out;
    }
    return decCands(tok);
  }
  var TOKRE = /-?\d[\d.,]*(?:\/-?\d[\d.,]*)?/g;
  // ", " y ";" separan valores (coordenadas, raíces): "(0, 1)" son dos números, no el decimal 0,1.
  function numTokens(s) { return (conRaices(norm(String(s == null ? '' : s).replace(/[,;]\s+|;/g, ' # '))).replace(/#/g, ' ').match(TOKRE) || []); }
  function igual(cands, v) {
    for (var i = 0; i < cands.length; i++) if (Math.abs(cands[i] - v) <= 0.01 + 1e-9) return true;
    return false;
  }
  function parsePoly(s) {
    s = norm(s);
    s = s.replace(/[⁰¹²³⁴-⁹]+/g, function (m) { return '^' + m.split('').map(function (c) { return SUPMAP[c]; }).join(''); });
    s = s.replace(/\*\*/g, '^').replace(/[*·]/g, '');
    if (s.lastIndexOf('=') >= 0) s = s.slice(s.lastIndexOf('=') + 1);
    s = s.replace(/[a-z]/g, 'x');
    if (!s) return null;
    var terms = [], i = 0, re = /^([+-])?(\d+(?:[.,]\d+)?)?(x(?:\^(\d+))?)?/;
    while (i < s.length) {
      var m = re.exec(s.slice(i));
      if (!m || m[0].length === 0 || (!m[2] && !m[3])) return null;
      var c = m[2] ? parseFloat(m[2].replace(',', '.')) : 1;
      if (m[1] === '-') c = -c;
      var e = m[3] ? (m[4] ? parseInt(m[4], 10) : 1) : 0;
      terms.push([c, e]); i += m[0].length;
    }
    return terms;
  }
  function polyIgual(terms, p) {
    if (!terms) return false;
    var xs = [1.3, -0.7, 2.1, 0.4];
    for (var k = 0; k < xs.length; k++) {
      var a = 0; terms.forEach(function (t) { a += t[0] * Math.pow(xs[k], t[1]); });
      var b = polyEval(p, xs[k]);
      if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(b))) return false;
    }
    return true;
  }
  // valor: string, o para modo error {veredicto:'correcto'|'error', texto:string}
  function revisar(item, valor) {
    if (item.modo === 'error') {
      if (!valor || !valor.veredicto) return false;
      if (valor.veredicto !== item.veredicto) return false;
      return revisarValor(item, valor.texto);
    }
    if (item.opciones) return norm(valor) !== '' && norm(valor) === norm(item.respuesta);
    return revisarValor(item, valor);
  }
  function revisarValor(item, txt) {
    txt = String(txt == null ? '' : txt);
    if (!norm(txt)) return false;
    var alts = [item.respuesta].concat(item.alt || []);
    for (var a = 0; a < alts.length; a++) if (norm(alts[a]) === norm(txt) && !item.nums) return true;
    if (item.poly) return polyIgual(parsePoly(txt), item.poly);
    if (item.nums) {
      var toks = numTokens(txt);
      // "(0,1)" sin espacio cuando se esperan varios valores enteros: separar por la coma
      if (toks.length !== item.nums.length) { var sep = toks.join(' , ').split(/,/).map(function (x) { return x.trim(); }).filter(Boolean); if (sep.length === item.nums.length) toks = sep; }
      if (toks.length !== item.nums.length) return false;
      var cands = toks.map(tokCands);
      if (item.ordenado) {
        for (var i = 0; i < cands.length; i++) if (!igual(cands[i], item.nums[i])) return false;
        return true;
      }
      var usados = [];
      for (var j = 0; j < item.nums.length; j++) {
        var ok = false;
        for (var k = 0; k < cands.length; k++) {
          if (usados[k]) continue;
          if (igual(cands[k], item.nums[j])) { usados[k] = true; ok = true; break; }
        }
        if (!ok) return false;
      }
      return true;
    }
    if (typeof item.num === 'number') {
      var t = numTokens(txt);
      if (!t.length) return false;
      return igual(tokCands(t[0]), item.num);
    }
    return false;
  }

  /* ------------------------------------------------------------------ *
   * 4. Dibujos SVG
   * ------------------------------------------------------------------ */
  var C = { navy: '#073B7A', blue: '#064FAE', orange: '#FF8A00', gold: '#F5C518', green: '#108A4F', red: '#C0392B', ink: '#1E2433', soft: '#E9F0FA' };
  function svg(w, h, inner, label, maxw) {
    return '<svg class="sf-svg" viewBox="0 0 ' + w + ' ' + h + '" style="max-width:' + (maxw || w) + 'px" role="img" aria-label="' + esc(label || 'figura') + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }
  function T(x, y, s, size, extra) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 14) + '" text-anchor="middle" font-family="Public Sans, Arial, sans-serif" fill="' + C.ink + '" ' + (extra || '') + '>' + esc(s) + '</text>';
  }
  // Objetos para contar
  var OBJ = {
    mango: { s: 'mango', p: 'mangos', d: function (x, y) {
      return '<ellipse cx="' + x + '" cy="' + (y + 2) + '" rx="13" ry="16" fill="#FFB020" stroke="#B86E00" stroke-width="1.5" transform="rotate(-20 ' + x + ' ' + y + ')"/>' +
        '<ellipse cx="' + (x - 4) + '" cy="' + (y + 6) + '" rx="6" ry="7" fill="#F26B1D" opacity=".55"/>' +
        '<path d="M' + (x + 3) + ' ' + (y - 13) + ' q8 -9 14 -4 q-7 6 -14 4z" fill="#2E9B4F" stroke="#1C6B34"/>'; } },
    estrella: { s: 'estrella', p: 'estrellas', d: function (x, y) { return star(x, y, 16, 7, C.gold, '#A07800'); } },
    balon: { s: 'balón', p: 'balones', d: function (x, y) {
      return '<circle cx="' + x + '" cy="' + y + '" r="15" fill="#fff" stroke="#222" stroke-width="1.6"/>' + regPoly(x, y, 6, 5, '#222', '#222', 1) +
        '<path d="M' + x + ' ' + (y - 6) + ' L' + x + ' ' + (y - 15) + ' M' + (x + 5.7) + ' ' + (y - 1.9) + ' L' + (x + 14) + ' ' + (y - 4.5) + ' M' + (x - 5.7) + ' ' + (y - 1.9) + ' L' + (x - 14) + ' ' + (y - 4.5) + ' M' + (x + 3.5) + ' ' + (y + 4.9) + ' L' + (x + 8.7) + ' ' + (y + 12) + ' M' + (x - 3.5) + ' ' + (y + 4.9) + ' L' + (x - 8.7) + ' ' + (y + 12) + '" stroke="#222" stroke-width="1.4"/>'; } },
    pandebono: { s: 'pandebono', p: 'pandebonos', d: function (x, y) {
      return '<circle cx="' + x + '" cy="' + y + '" r="15" fill="#F2C36B" stroke="#B5832B" stroke-width="1.6"/><circle cx="' + (x - 5) + '" cy="' + (y - 4) + '" r="2" fill="#C98F2E"/><circle cx="' + (x + 5) + '" cy="' + (y - 2) + '" r="2" fill="#C98F2E"/><circle cx="' + x + '" cy="' + (y + 6) + '" r="2" fill="#C98F2E"/>'; } },
    empanada: { s: 'empanada', p: 'empanadas', d: function (x, y) {
      return '<path d="M' + (x - 17) + ' ' + (y + 8) + ' Q' + x + ' ' + (y - 26) + ' ' + (x + 17) + ' ' + (y + 8) + ' Z" fill="#E9A23B" stroke="#9A5E12" stroke-width="1.6"/><path d="M' + (x - 15) + ' ' + (y + 8) + ' L' + (x + 15) + ' ' + (y + 8) + '" stroke="#9A5E12" stroke-width="3" stroke-dasharray="3 3"/>'; } }
  };
  function star(x, y, R, r, fill, stroke) {
    var pts = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1)); }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '" stroke="' + (stroke || '#333') + '" stroke-width="1.5"/>';
  }
  function regPts(x, y, R, n, rot) {
    var pts = [];
    for (var i = 0; i < n; i++) { var a = (rot == null ? -Math.PI / 2 : rot) + i * 2 * Math.PI / n; pts.push([x + R * Math.cos(a), y + R * Math.sin(a)]); }
    return pts;
  }
  function ptsStr(pts) { return pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }
  function regPoly(x, y, R, n, fill, stroke, sw, rot) {
    return '<polygon points="' + ptsStr(regPts(x, y, R, n, rot)) + '" fill="' + fill + '" stroke="' + (stroke || C.ink) + '" stroke-width="' + (sw || 2) + '"/>';
  }
  function grupoObj(key, k, tachados, x0, y0, porFila) {
    porFila = porFila || 5; var s = '';
    for (var i = 0; i < k; i++) {
      var cx = x0 + 22 + (i % porFila) * 42, cy = y0 + 22 + Math.floor(i / porFila) * 42;
      s += OBJ[key].d(cx, cy);
      if (tachados && i >= k - tachados) s += '<path d="M' + (cx - 16) + ' ' + (cy - 16) + ' L' + (cx + 16) + ' ' + (cy + 16) + ' M' + (cx + 16) + ' ' + (cy - 16) + ' L' + (cx - 16) + ' ' + (cy + 16) + '" stroke="' + C.red + '" stroke-width="3.5" stroke-linecap="round"/>';
    }
    return s;
  }
  function svgContar(key, k, tachados) {
    var filas = Math.ceil(k / 5), w = 2 * 22 + 4 * 42 + 10, h = filas * 42 + 6;
    return svg(w, h, grupoObj(key, k, tachados, 4, 2), k + ' ' + OBJ[key].p, 230);
  }
  function svgSuma(key, a, b) {
    var fa = Math.ceil(a / 3), fb = Math.ceil(b / 3), filas = Math.max(fa, fb);
    var w = 3 * 42 + 8, h = filas * 42 + 8, W = w * 2 + 44;
    var s = '<rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" rx="12" fill="none" stroke="' + C.blue + '" stroke-dasharray="5 4"/>' + grupoObj(key, a, 0, 2, 2, 3) +
      T(w + 22, h / 2 + 10, '+', 32, 'font-weight="800" fill="' + C.navy + '"') +
      '<rect x="' + (w + 45) + '" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" rx="12" fill="none" stroke="' + C.blue + '" stroke-dasharray="5 4"/>' + grupoObj(key, b, 0, w + 46, 2, 3);
    return svg(W, h, s, a + ' más ' + b, 330);
  }
  // Figuras
  var FIG = {
    circulo: { n: 'círculo', d: function (x, y, f) { return '<circle cx="' + x + '" cy="' + y + '" r="44" fill="' + f + '" stroke="' + C.ink + '" stroke-width="2.5"/>'; }, lados: 0 },
    cuadrado: { n: 'cuadrado', d: function (x, y, f) { return '<rect x="' + (x - 42) + '" y="' + (y - 42) + '" width="84" height="84" fill="' + f + '" stroke="' + C.ink + '" stroke-width="2.5"/>'; }, lados: 4 },
    triangulo: { n: 'triángulo', d: function (x, y, f) { return regPoly(x, y + 8, 52, 3, f, C.ink, 2.5); }, lados: 3 },
    rectangulo: { n: 'rectángulo', d: function (x, y, f) { return '<rect x="' + (x - 62) + '" y="' + (y - 34) + '" width="124" height="68" fill="' + f + '" stroke="' + C.ink + '" stroke-width="2.5"/>'; }, lados: 4 },
    pentagono: { n: 'pentágono', d: function (x, y, f) { return regPoly(x, y + 3, 48, 5, f, C.ink, 2.5); }, lados: 5 },
    hexagono: { n: 'hexágono', d: function (x, y, f) { return regPoly(x, y, 46, 6, f, C.ink, 2.5, 0); }, lados: 6 },
    octagono: { n: 'octágono', d: function (x, y, f) { return regPoly(x, y, 46, 8, f, C.ink, 2.5, Math.PI / 8); }, lados: 8 },
    rombo: { n: 'rombo', d: function (x, y, f) { return '<polygon points="' + x + ',' + (y - 48) + ' ' + (x + 34) + ',' + y + ' ' + x + ',' + (y + 48) + ' ' + (x - 34) + ',' + y + '" fill="' + f + '" stroke="' + C.ink + '" stroke-width="2.5"/>'; }, lados: 4 }
  };
  var RELL = ['#FFD9A8', '#CFE0FA', '#CDEFD9', '#FBE3A0', '#F6CFCB', '#E1D6F5'];
  function cota(x1, y1, x2, y2, txt, off) {
    // segmento de medida con texto
    off = off || 0;
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return '<text x="' + mx + '" y="' + (my + off) + '" font-size="15" font-weight="700" text-anchor="middle" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '" paint-order="stroke" stroke="#fff" stroke-width="4">' + esc(txt) + '</text>';
  }
  function marcaRecto(x, y, dx, dy, s) {
    s = s || 12;
    return '<path d="M' + (x + dx * s) + ' ' + y + ' L' + (x + dx * s) + ' ' + (y + dy * s) + ' L' + x + ' ' + (y + dy * s) + '" fill="none" stroke="' + C.ink + '" stroke-width="1.5"/>';
  }
  // Dinero colombiano
  var MONEDA = {
    50: { a: '#D5D9DF', b: '#D5D9DF', t: '#333' },
    100: { a: '#D9B24C', b: '#D9B24C', t: '#4A3500' },
    200: { a: '#E1E4E8', b: '#CDB06A', t: '#333' },
    500: { a: '#D6D9DE', b: '#D9B24C', t: '#3A2A00' },
    1000: { a: '#D9B24C', b: '#D6D9DE', t: '#3A2A00' }
  };
  var BILLETE = {
    2000: { c: '#1E9FB0', l: '#BDEFF3' }, 5000: { c: '#8A6A35', l: '#EBDDC0' }, 10000: { c: '#C93C63', l: '#F9D3DE' },
    20000: { c: '#E07A1F', l: '#FFE1C2' }, 50000: { c: '#7E52A8', l: '#E6D8F3' }, 100000: { c: '#2F8A50', l: '#CFEBD8' }
  };
  function dibMoneda(x, y, v) {
    var m = MONEDA[v], s = '';
    s += '<circle cx="' + x + '" cy="' + y + '" r="25" fill="' + m.a + '" stroke="#6B6B6B" stroke-width="1.6"/>';
    s += '<circle cx="' + x + '" cy="' + y + '" r="18" fill="' + m.b + '" stroke="#8A8A8A" stroke-width="1" ' + (m.a === m.b ? 'stroke-dasharray="2 2"' : '') + '/>';
    s += '<text x="' + x + '" y="' + (y + 4.5) + '" font-size="' + (v >= 1000 ? 11 : 13) + '" font-weight="800" text-anchor="middle" font-family="Public Sans, Arial, sans-serif" fill="' + m.t + '">' + esc(fmtM(v)) + '</text>';
    return s;
  }
  function dibBillete(x, y, v) {
    var b = BILLETE[v], s = '';
    s += '<rect x="' + x + '" y="' + y + '" width="128" height="60" rx="6" fill="' + b.c + '" stroke="#333" stroke-width="1.2"/>';
    s += '<rect x="' + (x + 6) + '" y="' + (y + 6) + '" width="116" height="48" rx="4" fill="' + b.l + '"/>';
    s += '<circle cx="' + (x + 26) + '" cy="' + (y + 30) + '" r="15" fill="' + b.c + '" opacity=".35"/>';
    s += '<text x="' + (x + 80) + '" y="' + (y + 33) + '" font-size="18" font-weight="800" text-anchor="middle" font-family="Public Sans, Arial, sans-serif" fill="#1E2433">' + esc(fmtM(v)) + '</text>';
    s += '<text x="' + (x + 80) + '" y="' + (y + 47) + '" font-size="9" font-weight="700" letter-spacing="2" text-anchor="middle" font-family="Public Sans, Arial, sans-serif" fill="#1E2433">PESOS</text>';
    return s;
  }
  function svgDinero(lista, maxw) {
    // lista de denominaciones; billetes primero
    lista = lista.slice().sort(function (a, b) { return b - a; });
    var W = 340, x = 4, y = 4, fila = 0, s = '';
    lista.forEach(function (v) {
      var esB = v >= 2000, w = esB ? 132 : 56, h = esB ? 64 : 56;
      if (x + w > W) { x = 4; y += fila + 6; fila = 0; }
      s += esB ? dibBillete(x, y, v) : dibMoneda(x + 27, y + 28, v);
      x += w + 4; fila = Math.max(fila, h);
    });
    var H = y + fila + 4;
    return svg(W, H, s, 'Dinero: ' + lista.map(fmtM).join(', '), maxw || 340);
  }
  function svgTablero(prods) {
    var h = 50 + prods.length * 30, s = '';
    s += '<rect x="2" y="2" width="316" height="' + (h - 4) + '" rx="10" fill="#1F4D3A" stroke="#8B5A2B" stroke-width="5"/>';
    s += '<text x="160" y="32" font-size="17" font-weight="800" text-anchor="middle" font-family="Public Sans, Arial, sans-serif" fill="#FFE9A8">Tienda de Don Chucho</text>';
    prods.forEach(function (p, i) {
      var yy = 62 + i * 30;
      s += '<text x="22" y="' + yy + '" font-size="15" font-family="Public Sans, Arial, sans-serif" fill="#fff">' + esc(p[0]) + '</text>';
      s += '<text x="298" y="' + yy + '" font-size="15" font-weight="800" text-anchor="end" font-family="Public Sans, Arial, sans-serif" fill="#FFE9A8">' + esc(fmtM(p[1])) + '</text>';
      s += '<line x1="22" y1="' + (yy + 8) + '" x2="298" y2="' + (yy + 8) + '" stroke="#fff" stroke-opacity=".18"/>';
    });
    return svg(320, h, s, 'Lista de precios de la Tienda de Don Chucho', 320);
  }

  /* ------------------------------------------------------------------ *
   * 5. Constructor de ítems
   * ------------------------------------------------------------------ */
  function it(enunciado, respuesta, explicacion, extra) {
    var o = { enunciado: enunciado, respuesta: String(respuesta), explicacion: explicacion || '' };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    return o;
  }
  function numIt(enun, num, expl, unidad, extra) {
    var e = extra || {}; e.num = num;
    return it(enun, fmtN(num) + (unidad ? ' ' + unidad : ''), expl, e);
  }
  function moneyIt(enun, num, expl, extra) {
    var e = extra || {}; e.num = num;
    return it(enun, fmtM(num), expl, e);
  }
  function opc(enun, correcta, otras, expl, extra, r) {
    var lista = [correcta].concat(otras.filter(function (o) { return (o.v || o) !== (correcta.v || correcta); }));
    lista = r.sh(lista).map(function (o) { return typeof o === 'string' ? { v: o, html: esc(o) } : o; });
    var e = extra || {}; e.opciones = lista;
    return it(enun, correcta.v || correcta, expl, e);
  }

  /* ------------------------------------------------------------------ *
   * 6. Tipo: CÁLCULO
   * ------------------------------------------------------------------ */
  var OBJK = ['mango', 'estrella', 'balon', 'pandebono', 'empanada'];
  function opH(a, op, b) { return a + ' ' + op + ' ' + b + ' = ?'; }
  var CALC = [];
  CALC[0] = [
    function (r) { var k = r.i(1, 10), o = r.p(OBJK); return it('¿Cuántos ' + OBJ[o].p + ' hay? Cuéntalos tocando cada uno.', k, 'Toca cada ' + OBJ[o].s + ' una sola vez y di un número: 1, 2, 3… El último número que dijiste es ' + k + '.', { num: k, svg: svgContar(o, k) }); },
    function (r) { var a = r.i(1, 5), b = r.i(1, Math.min(5, 10 - a)), o = r.p(OBJK); return it('Junta los dos grupos. ¿Cuántos ' + OBJ[o].p + ' hay en total?', a + b, 'Cuenta el primer grupo (' + a + ') y sigue contando el segundo: ' + a + ' + ' + b + ' = ' + (a + b) + '.', { num: a + b, svg: svgSuma(o, a, b) }); },
    function (r) { var a = r.i(3, 10), b = r.i(1, a - 1), o = r.p(OBJK); return it('Los ' + OBJ[o].p + ' tachados ya se usaron. ¿Cuántos quedan?', a - b, 'Había ' + a + ' y se tacharon ' + b + '. Cuenta solo los que no tienen X: ' + a + ' − ' + b + ' = ' + (a - b) + '.', { num: a - b, svg: svgContar(o, a, b) }); }
  ];
  CALC[1] = [
    function (r) { var a = r.i(10, 79), b = r.i(5, 99 - a); return it(opH(a, '+', b), a + b, 'Suma unidades con unidades y decenas con decenas: ' + a + ' + ' + b + ' = ' + (a + b) + '.', { num: a + b }); },
    function (r) { var a = r.i(20, 99), b = r.i(5, a - 3); return it(opH(a, '−', b), a - b, 'Resta primero las unidades y luego las decenas. Comprueba: ' + (a - b) + ' + ' + b + ' = ' + a + '.', { num: a - b }); },
    function (r) { var a = r.i(10, 60), c = r.i(a + 5, 99); return it(a + ' + ▢ = ' + c + '. ¿Qué número va en el cuadro?', c - a, 'El número que falta es ' + c + ' − ' + a + ' = ' + (c - a) + ', porque ' + a + ' + ' + (c - a) + ' = ' + c + '.', { num: c - a }); }
  ];
  CALC[2] = [
    function (r) { var a, b; do { a = r.i(105, 689); b = r.i(105, 999 - a); } while ((a % 10) + (b % 10) < 10); return it(opH(a, '+', b), a + b, 'Al sumar unidades pasas de 9: escribe la unidad y lleva 1 a las decenas. Resultado: ' + (a + b) + '.', { num: a + b }); },
    function (r) { var a, b; do { a = r.i(300, 999); b = r.i(101, a - 50); } while ((a % 10) >= (b % 10)); return it(opH(a, '−', b), a - b, 'Como las unidades de arriba son menores, presta 1 decena (10 unidades). Comprueba: ' + (a - b) + ' + ' + b + ' = ' + a + '.', { num: a - b }); },
    function (r) { var n = r.i(2, 5), m = r.i(2, 10), s = []; for (var i = 0; i < n; i++) s.push(m); return it(s.join(' + ') + ' = ' + n + ' × ' + m + ' = ?', n * m, 'Sumar ' + n + ' veces el ' + m + ' es multiplicar: ' + n + ' × ' + m + ' = ' + (n * m) + '.', { num: n * m }); },
    function (r) { var a = r.i(100, 450); return it('El doble de ' + a + ' es ?', 2 * a, 'Doble significa sumar el número dos veces: ' + a + ' + ' + a + ' = ' + (2 * a) + '.', { num: 2 * a }); }
  ];
  CALC[3] = [
    function (r) { var a = r.i(2, 10), b = r.i(2, 10); return it(opH(a, '×', b), a * b, a + ' × ' + b + ' = ' + (a * b) + ' (tabla del ' + a + ').', { num: a * b }); },
    function (r) { var b = r.i(2, 10), q = r.i(2, 10); return it(opH(b * q, '÷', b), q, 'Busca qué número por ' + b + ' da ' + (b * q) + ': ' + q + ' × ' + b + ' = ' + (b * q) + '.', { num: q }); },
    function (r) { var a = r.i(1200, 6500), b = r.i(1100, 9999 - a); return it(opH(a, '+', b), a + b, 'Suma columna por columna (unidades, decenas, centenas, unidades de mil) llevando cuando pases de 9: ' + (a + b) + '.', { num: a + b }); },
    function (r) { var a = r.i(3000, 9999), b = r.i(1000, a - 100); return it(opH(a, '−', b), a - b, 'Resta columna por columna prestando cuando haga falta. Comprueba: ' + (a - b) + ' + ' + b + ' = ' + a + '.', { num: a - b }); }
  ];
  CALC[4] = [
    function (r) { var a = r.i(102, 899), b = r.i(12, 89); return it(opH(a, '×', b), a * b, 'Multiplica ' + a + ' × ' + (b % 10) + ' y ' + a + ' × ' + (b - b % 10) + ', luego suma los productos parciales: ' + (a * (b % 10)) + ' + ' + (a * (b - b % 10)) + ' = ' + (a * b) + '.', { num: a * b }); },
    function (r) { var d = r.i(3, 9), q = r.i(12, 99), re = r.i(1, d - 1), n = d * q + re; return it(n + ' ÷ ' + d + ' = ?  Escribe el cociente y el residuo.', 'cociente ' + q + ', residuo ' + re, q + ' × ' + d + ' = ' + (q * d) + ' y sobran ' + re + ' (' + (q * d) + ' + ' + re + ' = ' + n + '). El residuo siempre es menor que ' + d + '.', { nums: [q, re], ordenado: true, ayuda: 'Ej.: 12 y 3 (cociente y residuo)' }); },
    function (r) { var d = r.i(2, 9), n = r.i(1, d - 1), k = r.i(2, 6); var g = gcd(n, d); n /= g; d /= g; return it(frH(n, d) + ' = <span class="sf-frac"><span>▢</span><span>' + (d * k) + '</span></span>  ¿Qué número va en el cuadro?', n * k, 'El denominador se multiplicó por ' + k + ' (' + d + ' × ' + k + ' = ' + (d * k) + '); el numerador también: ' + n + ' × ' + k + ' = ' + (n * k) + '.', { num: n * k }); },
    function (r) { var a = r.i(1000, 9000), b = r.i(2, 9); return it(opH(a, '×', b), a * b, a + ' × ' + b + ' = ' + fmtN(a * b) + '.', { num: a * b }); }
  ];
  CALC[5] = [
    function (r) { var d = r.i(3, 12), a = r.i(1, d - 1), b = r.i(1, d - 1); var s = F(a + b, d); return it(frH(a, d) + ' + ' + frH(b, d) + ' = ?', fStr(s), 'Mismo denominador: suma los numeradores y deja el denominador: ' + (a + b) + '/' + d + (s.d !== d ? ' = ' + fStr(s) + ' simplificada' : '') + '.', { num: fVal(s) }); },
    function (r) { var d1 = r.i(2, 6), d2; do { d2 = r.i(2, 8); } while (d2 === d1); var a = F(r.i(1, d1 - 1), d1), b = F(r.i(1, d2 - 1), d2); var s = fAdd(a, b), m = lcm(a.d, b.d); return it(fH(a) + ' + ' + fH(b) + ' = ?', fStr(s), 'Busca un denominador común (' + m + '): ' + (a.n * m / a.d) + '/' + m + ' + ' + (b.n * m / b.d) + '/' + m + ' = ' + ((a.n * m / a.d) + (b.n * m / b.d)) + '/' + m + (fStr(s) !== ((a.n * m / a.d) + (b.n * m / b.d)) + '/' + m ? ' = ' + fStr(s) : '') + '. Nunca sumes los denominadores.', { num: fVal(s) }); },
    function (r) { var a, b, s, m; do { var d1 = r.i(2, 8), d2 = r.i(2, 8); a = F(r.i(1, d1 - 1), d1); b = F(r.i(1, d2 - 1), d2); s = fSub(a, b); } while (s.n <= 0 || a.d === b.d); m = lcm(a.d, b.d); return it(fH(a) + ' − ' + fH(b) + ' = ?', fStr(s), 'Denominador común ' + m + ': ' + (a.n * m / a.d) + '/' + m + ' − ' + (b.n * m / b.d) + '/' + m + ' = ' + fStr(s) + ' (simplificada).', { num: fVal(s) }); },
    function (r) { var a = r.i(11, 999) / 10, b = r.i(11, 999) / 100; return it(fmtN(a) + ' + ' + fmtN(b) + ' = ?', fmtN(r2(a + b)), 'Alinea las comas y completa con ceros: ' + fmtN(a) + '0 + ' + fmtN(b) + ' = ' + fmtN(r2(a + b)) + '.', { num: r2(a + b) }); },
    function (r) { var a = r.i(200, 999) / 10, b = r.i(11, Math.floor(a * 10) - 5) / 10; return it(fmtN(a) + ' − ' + fmtN(b) + ' = ?', fmtN(r2(a - b)), 'Alinea las comas y resta como con números enteros: ' + fmtN(r2(a - b)) + '.', { num: r2(a - b) }); },
    function (r) { var a = r.i(12, 99) / 10, b = r.i(2, 9); return it(fmtN(a) + ' × ' + b + ' = ?', fmtN(r2(a * b)), 'Multiplica sin la coma (' + Math.round(a * 10) + ' × ' + b + ' = ' + Math.round(a * 10 * b) + ') y deja 1 cifra decimal: ' + fmtN(r2(a * b)) + '.', { num: r2(a * b) }); }
  ];
  CALC[6] = [
    function (r) { var a = r.i(2, 20), b = r.i(2, 9), c = r.i(2, 9); return it(a + ' + ' + b + ' × ' + c + ' = ?', a + b * c, 'Primero la multiplicación: ' + b + ' × ' + c + ' = ' + (b * c) + '; luego ' + a + ' + ' + (b * c) + ' = ' + (a + b * c) + '.', { num: a + b * c }); },
    function (r) { var a = r.i(2, 12), b = r.i(2, 9), c = r.i(2, 6); return it('(' + a + ' + ' + b + ') × ' + c + ' = ?', (a + b) * c, 'Primero el paréntesis: ' + (a + b) + '; luego × ' + c + ' = ' + ((a + b) * c) + '.', { num: (a + b) * c }); },
    function (r) { var a = r.i(3, 9), b = r.i(2, 9), e = r.i(2, 5), k = r.i(2, 6); var c = e * k; return it(a + ' × ' + b + ' − ' + c + ' ÷ ' + e + ' = ?', a * b - k, 'Multiplicación y división primero: ' + (a * b) + ' − ' + k + ' = ' + (a * b - k) + '.', { num: a * b - k }); },
    function (r) { var b = r.i(2, 5), e = b === 2 ? r.i(3, 7) : r.i(2, 4); var v = Math.pow(b, e); return it(b + '<sup>' + e + '</sup> = ?', v, 'La potencia multiplica la base por sí misma ' + e + ' veces: ' + Array(e + 1).join(b + ' · ').slice(0, -3) + ' = ' + v + '.', { num: v }); },
    function (r) { var a = r.i(2, 6), e = 2, b = r.i(2, 9), c = r.i(1, 9); return it(a + '<sup>2</sup> + ' + b + ' × ' + c + ' = ?', a * a + b * c, 'Primero potencias (' + a + '² = ' + (a * a) + '), luego multiplicaciones (' + (b * c) + '), al final la suma: ' + (a * a + b * c) + '.', { num: a * a + b * c }); },
    function (r) { var a = r.i(11, 59) / 10, b = r.i(2, 9) / 10; var p = Math.round(a * b * 100) / 100; return it(fmtN(a) + ' × ' + fmtN(b) + ' = ?', fmtN(p), 'Multiplica sin comas y cuenta las cifras decimales (1 + 1 = 2): ' + fmtN(p) + '.', { num: p }); },
    function (r) { var a = F(r.i(1, 7), r.i(2, 9)), b = F(r.i(1, 7), r.i(2, 9)); var m = fMul(a, b); return it(fH(a) + ' × ' + fH(b) + ' = ?', fStr(m), 'Numerador por numerador y denominador por denominador; luego simplifica: ' + fStr(m) + '.', { num: fVal(m) }); },
    function (r) { var a = F(r.i(1, 7), r.i(2, 9)), b = F(r.i(1, 7), r.i(2, 9)); var m = fDiv(a, b); return it(fH(a) + ' ÷ ' + fH(b) + ' = ?', fStr(m), 'Dividir es multiplicar por el inverso: ' + fStr(a) + ' × ' + b.d + '/' + b.n + ' = ' + fStr(m) + '.', { num: fVal(m) }); }
  ];
  CALC[7] = [
    function (r) { var a = r.nz(-20, 20), b = r.nz(-20, 20), c = r.nz(-15, 15); var v = a + b - c; return it(sg(a) + ' + ' + par(b) + ' − ' + par(c) + ' = ?', sg(v), 'Restar un número es sumar su opuesto: ' + sg(a) + ' + ' + par(b) + ' + ' + par(-c) + ' = ' + sg(v) + '.', { num: v }); },
    function (r) { var a = r.nz(-12, 12), b = r.nz(-9, 9); return it(par(a) + ' × ' + par(b) + ' = ?', sg(a * b), 'Signos iguales dan +, signos diferentes dan −. ' + Math.abs(a) + ' × ' + Math.abs(b) + ' = ' + Math.abs(a * b) + ', resultado ' + sg(a * b) + '.', { num: a * b }); },
    function (r) { var b = r.nz(-9, 9), q = r.nz(-12, 12); return it(par(b * q) + ' ÷ ' + par(b) + ' = ?', sg(q), 'Divide los valores absolutos y aplica la ley de signos: ' + sg(q) + '.', { num: q }); },
    function (r) { var p = r.p([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]), n = r.i(2, 40) * 20; var v = p * n / 100; return it(p + ' % de ' + fmtN(n) + ' = ?', fmtN(v), p + ' % significa ' + p + ' de cada 100: ' + fmtN(n) + ' × ' + p + ' ÷ 100 = ' + fmtN(v) + '.', { num: v }); },
    function (r) { var a = r.i(2, 9), b = r.i(2, 9), k = r.i(2, 8); if (a === b) b++; return it(frH(a, b) + ' = <span class="sf-frac"><span>' + (a * k) + '</span><span>x</span></span>  Halla x.', 'x = ' + (b * k), 'En una proporción los productos cruzados son iguales: ' + a + ' · x = ' + b + ' · ' + (a * k) + ', así x = ' + (b * k) + '.', { num: b * k }); }
  ];
  CALC[8] = [
    function (r) { var a = r.nz(-4, 5), b = r.nz(-6, 6), c = r.i(-9, 9), x = r.nz(-3, 3); var p = {}; p[2] = a; p[1] = b; p[0] = c; var v = polyEval(p, x); return it('Si x = ' + sg(x) + ', ¿cuánto vale ' + polyTxt(p, 'x', true) + '?', sg(v), 'Reemplaza x por ' + par(x) + ' con paréntesis: ' + a + '·' + par(x) + '² + ' + par(b) + '·' + par(x) + ' + ' + par(c) + ' = ' + (a * x * x) + ' + ' + par(b * x) + ' + ' + par(c) + ' = ' + sg(v) + '.', { num: v }); },
    function (r) { var b = r.i(2, 9), m = r.i(2, 9), n = r.i(2, 9); var t = r.i(0, 2); if (t === 0) return it(b + '<sup>' + m + '</sup> · ' + b + '<sup>' + n + '</sup> = ' + b + '<sup>▢</sup>  ¿Qué exponente va en el cuadro?', m + n, 'Al multiplicar potencias de igual base se suman los exponentes: ' + m + ' + ' + n + ' = ' + (m + n) + '.', { num: m + n }); if (t === 1) return it('(' + b + '<sup>' + m + '</sup>)<sup>' + n + '</sup> = ' + b + '<sup>▢</sup>  ¿Qué exponente va en el cuadro?', m * n, 'Potencia de una potencia: se multiplican los exponentes: ' + m + ' × ' + n + ' = ' + (m * n) + '.', { num: m * n }); var M = m + n; return it(b + '<sup>' + M + '</sup> ÷ ' + b + '<sup>' + n + '</sup> = ' + b + '<sup>▢</sup>  ¿Qué exponente va en el cuadro?', m, 'Al dividir potencias de igual base se restan los exponentes: ' + M + ' − ' + n + ' = ' + m + '.', { num: m }); },
    function (r) { var n = r.i(4, 25); return it('√' + (n * n) + ' = ?', n, n + ' × ' + n + ' = ' + (n * n) + ', por eso √' + (n * n) + ' = ' + n + '.', { num: n }); },
    function (r) { var a = r.i(2, 12), b = r.i(2, 6), c = r.i(1, 3); var v = a + Math.pow(b, c + 1); return it('√' + (a * a) + ' + ' + b + '<sup>' + (c + 1) + '</sup> = ?', v, '√' + (a * a) + ' = ' + a + ' y ' + b + supTxt(c + 1) + ' = ' + Math.pow(b, c + 1) + '; suma: ' + v + '.', { num: v }); },
    function (r) { var b = r.i(2, 5), e = r.i(1, 3); return it(b + '<sup>' + MENOS + e + '</sup> = ?  (escríbelo como fracción)', '1/' + Math.pow(b, e), 'Un exponente negativo invierte la base: ' + b + supTxt('-' + e) + ' = 1/' + b + supTxt(e) + ' = 1/' + Math.pow(b, e) + '.', { num: 1 / Math.pow(b, e) }); }
  ];
  CALC[9] = [
    function (r) { var a = r.nz(-9, 9), x = r.i(-10, 10), b = r.nz(-20, 20); var c = a * x + b; return it('Resuelve: ' + (a === 1 ? '' : a === -1 ? MENOS : sg(a)) + 'x ' + (b < 0 ? MENOS : '+') + ' ' + Math.abs(b) + ' = ' + sg(c), 'x = ' + sg(x), 'Pasa ' + sg(b) + ' al otro lado restando: ' + sg(a) + 'x = ' + sg(c - b) + '. Divide entre ' + sg(a) + ': x = ' + sg(x) + '. Comprueba sustituyendo.', { num: x }); },
    function (r) { var a = r.i(2, 7), b = r.nz(-8, 8), x = r.i(-9, 9); var c = a * (x + b); return it('Resuelve: ' + a + '(x ' + (b < 0 ? MENOS : '+') + ' ' + Math.abs(b) + ') = ' + sg(c), 'x = ' + sg(x), 'Divide entre ' + a + ': x ' + (b < 0 ? MENOS : '+') + ' ' + Math.abs(b) + ' = ' + sg(c / a) + '. Luego x = ' + sg(x) + '.', { num: x }); },
    function (r) { var a, c; do { a = r.i(2, 9); c = r.i(1, 8); } while (a === c); var x = r.i(-8, 8), b = r.i(-15, 15), d = a * x + b - c * x; return it('Resuelve: ' + a + 'x ' + (b < 0 ? MENOS : '+') + ' ' + Math.abs(b) + ' = ' + (c === 1 ? '' : c) + 'x ' + (d < 0 ? MENOS : '+') + ' ' + Math.abs(d), 'x = ' + sg(x), 'Agrupa las x a un lado: ' + (a - c) + 'x = ' + sg(d - b) + '; x = ' + sg(x) + '.', { num: x }); },
    function (r) { var k = r.i(2, 6), x = k * r.i(-6, 6), b = r.i(1, 9); var c = x / k + b; return it('Resuelve: <span class="sf-frac"><span>x</span><span>' + k + '</span></span> + ' + b + ' = ' + sg(c), 'x = ' + sg(x), 'Resta ' + b + ': x/' + k + ' = ' + sg(c - b) + '; multiplica por ' + k + ': x = ' + sg(x) + '.', { num: x }); }
  ];
  var TRIG = [
    ['sen 30°', '1/2', 0.5], ['cos 30°', '√3/2', Math.sqrt(3) / 2], ['tan 30°', '√3/3', Math.sqrt(3) / 3],
    ['sen 45°', '√2/2', Math.sqrt(2) / 2], ['cos 45°', '√2/2', Math.sqrt(2) / 2], ['tan 45°', '1', 1],
    ['sen 60°', '√3/2', Math.sqrt(3) / 2], ['cos 60°', '1/2', 0.5], ['tan 60°', '√3', Math.sqrt(3)]
  ];
  CALC[10] = [
    function (r) { var p, q; do { p = r.nz(-9, 9); q = r.nz(-9, 9); } while (p === q); var P = {}; P[2] = 1; P[1] = -(p + q); P[0] = p * q; return it('Resuelve factorizando: ' + polyTxt(P, 'x', true) + ' = 0', 'x = ' + sg(Math.min(p, q)) + ' y x = ' + sg(Math.max(p, q)), 'Busca dos números que multiplicados den ' + sg(p * q) + ' y sumados den ' + sg(p + q) + ': ' + sg(p) + ' y ' + sg(q) + '. (x ' + (p < 0 ? '+ ' + (-p) : MENOS + ' ' + p) + ')(x ' + (q < 0 ? '+ ' + (-q) : MENOS + ' ' + q) + ') = 0.', { nums: [p, q], ayuda: 'Ej.: 2 y −5' }); },
    function (r) { var t = r.p(TRIG); return it(t[0] + ' = ?  (valor exacto)', t[1], 'Usa los triángulos notables: en el de 30°-60° los lados son 1, √3 y 2; en el de 45° son 1, 1 y √2. ' + t[0] + ' = ' + t[1] + ' ≈ ' + fmtN(t[2], 3) + '.', { num: t[2], alt: [t[1].replace('√', 'raiz')] }); },
    function (r) { var h = 2 * r.i(2, 15), a = r.p([30, 60]); var op = a === 30 ? h / 2 : null; if (a === 30) return it('En un triángulo rectángulo la hipotenusa mide ' + h + ' cm y un ángulo agudo mide 30°. ¿Cuánto mide el cateto opuesto a ese ángulo?', fmtN(op) + ' cm', 'sen 30° = opuesto / hipotenusa = 1/2, así opuesto = ' + h + ' × 1/2 = ' + op + ' cm.', { num: op }); return it('En un triángulo rectángulo la hipotenusa mide ' + h + ' cm y un ángulo agudo mide 60°. ¿Cuánto mide el cateto adyacente a ese ángulo?', fmtN(h / 2) + ' cm', 'cos 60° = adyacente / hipotenusa = 1/2, así adyacente = ' + h + ' × 1/2 = ' + (h / 2) + ' cm.', { num: h / 2 }); },
    function (r) { var p = r.nz(-8, 8), a = r.i(2, 5); var P = {}; P[2] = a; P[1] = -a * p; P[0] = 0; return it('Resuelve: ' + polyTxt(P, 'x', true) + ' = 0', 'x = 0 y x = ' + sg(p), 'Saca factor común: ' + a + 'x(x ' + (p < 0 ? '+ ' + (-p) : MENOS + ' ' + p) + ') = 0, entonces x = 0 o x = ' + sg(p) + '.', { nums: [0, p], ayuda: 'Ej.: 0 y 4' }); }
  ];
  CALC[11] = [
    function (r) { var g = r.i(2, 5), P = {}; P[g] = r.nz(-6, 6); for (var e = g - 1; e >= 0; e--) if (r.b(0.6)) P[e] = r.nz(-9, 9); var D = polyDer(P); return it('Deriva: f(x) = ' + polyTxt(P, 'x', true) + '.  f′(x) = ?', polyTxt(D, 'x'), 'Regla de la potencia: (a·xⁿ)′ = a·n·xⁿ⁻¹ y la derivada de una constante es 0. f′(x) = ' + polyTxt(D, 'x') + '.', { poly: D, ayuda: 'Ej.: 6x^2 - 4x + 1' }); },
    function (r) { var P = {}; P[3] = r.nz(-3, 3); P[2] = r.nz(-5, 5); P[1] = r.i(-6, 6); var x = r.i(-3, 3), D = polyDer(P), v = polyEval(D, x); return it('Si f(x) = ' + polyTxt(P, 'x', true) + ', calcula f′(' + sg(x) + ').', sg(v), 'f′(x) = ' + polyTxt(D, 'x') + '. Reemplaza x = ' + sg(x) + ': f′(' + sg(x) + ') = ' + sg(v) + '.', { num: v }); },
    function (r) { var b = r.p([2, 3, 5, 10]), k = r.i(0, b === 2 ? 7 : b === 10 ? 5 : 4); var v = Math.pow(b, k); return it('log<sub>' + b + '</sub> ' + fmtN(v) + ' = ?', k, 'log' + '<sub>' + b + '</sub> pregunta: ¿a qué exponente elevo ' + b + ' para obtener ' + fmtN(v) + '? ' + b + supTxt(k) + ' = ' + fmtN(v) + ', así que es ' + k + '.', { num: k }); },
    function (r) { var b = r.p([2, 3, 4, 5]), k = r.i(2, b === 2 ? 6 : 3); var v = Math.pow(b, k); return it('Resuelve: log<sub>' + b + '</sub> x = ' + k, 'x = ' + v, 'Por definición, log<sub>' + b + '</sub> x = ' + k + ' significa x = ' + b + supTxt(k) + ' = ' + v + '.', { num: v }); },
    function (r) { var m = r.i(1, 4), n = r.i(1, 4); return it('log<sub>2</sub> ' + Math.pow(2, m) + ' + log<sub>2</sub> ' + Math.pow(2, n) + ' = ?', m + n, 'Cada logaritmo vale ' + m + ' y ' + n + '; también log(a) + log(b) = log(a·b) = log₂ ' + Math.pow(2, m + n) + ' = ' + (m + n) + '.', { num: m + n }); }
  ];

  /* ------------------------------------------------------------------ *
   * 7. Tipo: PROBLEMAS COTIDIANOS (Cali, Colombia)
   * ------------------------------------------------------------------ */
  function P(enun, num, unidad, expl, extra, dinero) {
    var e = extra || {}; e.num = num;
    return it(enun, dinero ? fmtM(num) : fmtN(num) + (unidad ? ' ' + unidad : ''), expl, e);
  }
  var NOMBRES = ['Valentina', 'Santiago', 'Mariana', 'Samuel', 'Isabella', 'Matías', 'Salomé', 'Jerónimo', 'Luciana', 'Emmanuel', 'Sara', 'Juan José'];
  var PROB = [
    { id: 'mio', f: function (r, g, nm) {
      if (g <= 1) { var a = r.i(2, g ? 40 : 5), b = r.i(1, g ? 30 : 4); return P('En un bus del MIO van ' + a + ' pasajeros. En la estación Universidades se suben ' + b + ' más. ¿Cuántos pasajeros van ahora?', a + b, 'pasajeros', 'Se suben, entonces juntamos: ' + a + ' + ' + b + ' = ' + (a + b) + '.', g === 0 && a + b <= 10 ? { svg: svgSuma('estrella', a, b) } : null); }
      if (g <= 4) { var x = r.i(30, 90), y = r.i(10, 40), z = r.i(5, x - 5); return P('Un articulado del MIO sale con ' + x + ' pasajeros. En la estación Ermita se bajan ' + z + ' y se suben ' + y + '. ¿Cuántos pasajeros lleva ahora?', x - z + y, 'pasajeros', x + ' − ' + z + ' + ' + y + ' = ' + (x - z + y) + '.'); }
      if (g <= 8) { var N = r.i(4, 9) * 20, p = r.p([25, 40, 60, 75]); var s = N * p / 100; return P('Un articulado del MIO lleva ' + N + ' pasajeros y el ' + p + ' % va sentado. ¿Cuántos pasajeros van de pie?', N - s, 'pasajeros', 'Sentados: ' + p + ' % de ' + N + ' = ' + s + '. De pie: ' + N + ' − ' + s + ' = ' + (N - s) + '.'); }
      var t = r.p([20, 30, 40, 45]), v = r.p([18, 24, 30, 36]); return P('Un bus del MIO avanza a una velocidad promedio de ' + v + ' km/h. ¿Cuántos kilómetros recorre en ' + t + ' minutos?', v * t / 60, 'km', 'Convierte los minutos a horas: ' + t + '/60 h. Distancia = ' + v + ' × ' + t + '/60 = ' + fmtN(v * t / 60) + ' km.');
    } },
    { id: 'empanadas', f: function (r, g, nm) {
      if (g === 0) { var a = r.i(1, 5), b = r.i(1, 5); return P('Mamá frió ' + a + ' empanadas y luego ' + b + ' más. ¿Cuántas empanadas hay?', a + b, 'empanadas', a + ' y ' + b + ' son ' + (a + b) + '.', { svg: svgSuma('empanada', a, b) }); }
      if (g === 1) { var c = r.i(30, 99), d = r.i(10, c - 5); return P('En la tienda había ' + c + ' empanadas y se vendieron ' + d + '. ¿Cuántas quedan?', c - d, 'empanadas', 'Se vendieron (quitamos): ' + c + ' − ' + d + ' = ' + (c - d) + '.'); }
      if (g <= 5) { var pr = r.i(5, 15) * 100, n = r.i(2, g <= 3 ? 9 : 25); return P(nm + ' compra ' + n + ' empanadas de ' + fmtM(pr) + ' cada una. ¿Cuánto paga?', n * pr, '', n + ' × ' + fmtM(pr) + ' = ' + fmtM(n * pr) + '.', null, true); }
      var c1 = r.i(2, 5), m = r.i(2, 9); if (m === c1) m++; return P('Para ' + (8 * c1) + ' empanadas se usan ' + c1 + ' tazas de harina de maíz. ¿Cuántas tazas se necesitan para ' + (8 * m) + ' empanadas?', m, 'tazas', 'Proporción directa: cada taza rinde ' + 8 + ' empanadas. ' + (8 * m) + ' ÷ 8 = ' + m + ' tazas.');
    } },
    { id: 'pandebono', f: function (r, g, nm) {
      if (g === 0) { var k = r.i(1, 4), n = 2; return P('Hay ' + (n * k) + ' pandebonos para ' + n + ' niños. Si se reparten igual, ¿cuántos le tocan a cada uno?', k, 'pandebonos', 'Repartimos uno y uno: a cada niño le tocan ' + k + '.', { svg: svgContar('pandebono', n * k) }); }
      if (g === 1) { var a = r.i(20, 60), b = r.i(5, 19); return P('Una bandeja tiene ' + a + ' pandebonos. En el descanso se comen ' + b + '. ¿Cuántos quedan?', a - b, 'pandebonos', a + ' − ' + b + ' = ' + (a - b) + '.'); }
      if (g <= 3) { var n2 = r.i(2, 9), q = r.i(2, 9); return P('En la panadería reparten ' + (n2 * q) + ' pandebonos en ' + n2 + ' bolsas iguales. ¿Cuántos pandebonos lleva cada bolsa?', q, 'pandebonos', (n2 * q) + ' ÷ ' + n2 + ' = ' + q + '.'); }
      if (g <= 5) { var d = r.i(6, 12), q2 = r.i(8, 30), re = r.i(1, d - 1); return P('Se hornean ' + (d * q2 + re) + ' pandebonos y se empacan en bolsas de ' + d + '. ¿Cuántos pandebonos sobran sin completar bolsa?', re, 'pandebonos', (d * q2 + re) + ' ÷ ' + d + ' = ' + q2 + ' bolsas y sobran ' + re + '.'); }
      var den = r.p([4, 5, 8]), nu = r.i(1, den - 1), T = den * r.i(5, 15); return P('De ' + T + ' pandebonos se vendieron los ' + nu + '/' + den + ' en la mañana. ¿Cuántos se vendieron?', T * nu / den, 'pandebonos', T + ' ÷ ' + den + ' = ' + (T / den) + '; × ' + nu + ' = ' + (T * nu / den) + '.');
    } },
    { id: 'cholado', f: function (r, g, nm) {
      if (g <= 1) { var a = r.i(1, g ? 20 : 5), b = r.i(1, g ? 20 : 5); return P('Doña Rosa vendió ' + a + ' cholados en la mañana y ' + b + ' en la tarde. ¿Cuántos cholados vendió?', a + b, 'cholados', a + ' + ' + b + ' = ' + (a + b) + '.'); }
      if (g <= 4) { var p = r.i(4, 9) * 1000, x = r.i(3, 12), y = r.i(3, 12); return P('Doña Rosa vende cholados a ' + fmtM(p) + '. Vendió ' + x + ' el sábado y ' + y + ' el domingo. ¿Cuánto dinero recibió?', (x + y) * p, '', '(' + x + ' + ' + y + ') × ' + fmtM(p) + ' = ' + (x + y) + ' × ' + fmtM(p) + ' = ' + fmtM((x + y) * p) + '.', null, true); }
      if (g <= 7) { var n = 4 * r.i(2, 9); return P('Cada cholado lleva 1/4 de litro de jugo de maracuyá. ¿Cuántos litros de jugo se necesitan para ' + n + ' cholados?', n / 4, 'litros', n + ' × 1/4 = ' + n + ' ÷ 4 = ' + (n / 4) + ' litros.'); }
      var c = r.i(3, 8) * 1000, pg = r.p([20, 25, 40, 50]); return P('Preparar un cholado le cuesta a Doña Rosa ' + fmtM(c) + ' y quiere ganar el ' + pg + ' % sobre el costo. ¿A qué precio debe venderlo?', c * (100 + pg) / 100, '', 'Ganancia: ' + pg + ' % de ' + fmtM(c) + ' = ' + fmtM(c * pg / 100) + '. Precio: ' + fmtM(c) + ' + ' + fmtM(c * pg / 100) + ' = ' + fmtM(c * (100 + pg) / 100) + '.', null, true);
    } },
    { id: 'mangos', f: function (r, g, nm) {
      if (g === 0) { var k = r.i(2, 10); return P('En el árbol del patio hay estos mangos. ¿Cuántos mangos hay?', k, 'mangos', 'Contamos uno por uno: ' + k + '.', { svg: svgContar('mango', k) }); }
      if (g === 1) { var a = r.i(10, 50), b = r.i(10, 49); return P(nm + ' recogió ' + a + ' mangos y su hermano ' + b + '. ¿Cuántos mangos recogieron entre los dos?', a + b, 'mangos', a + ' + ' + b + ' = ' + (a + b) + '.'); }
      if (g <= 4) { var f = r.i(3, 9), c = r.i(4, g >= 4 ? 25 : 9); return P('Una caja tiene ' + f + ' filas con ' + c + ' mangos en cada fila. ¿Cuántos mangos hay en la caja?', f * c, 'mangos', f + ' × ' + c + ' = ' + (f * c) + '.'); }
      var pk = r.i(10, 30) * 200, kg = r.p([1.5, 2.5, 3.5, 0.5, 4.5]); return P('Un kilo de mango de azúcar cuesta ' + fmtM(pk) + ' en la galería Alameda. ¿Cuánto cuestan ' + fmtN(kg) + ' kg?', pk * kg, '', fmtN(kg) + ' × ' + fmtM(pk) + ' = ' + fmtM(pk * kg) + '.', null, true);
    } },
    { id: 'tienda', f: function (r, g, nm) {
      if (g <= 1) { var a = r.i(5, g ? 60 : 9), b = r.i(1, a - 1); return P('Don Chucho tenía ' + a + ' bolsas de leche en la tienda del barrio y vendió ' + b + '. ¿Cuántas le quedan?', a - b, 'bolsas', a + ' − ' + b + ' = ' + (a - b) + '.', g === 0 ? { svg: svgContar('estrella', a, b) } : null); }
      if (g <= 4) { var p1 = r.i(15, 45) * 100, p2 = r.i(8, 35) * 100; return P('En la tienda del barrio una libra de arroz cuesta ' + fmtM(p1) + ' y una panela ' + fmtM(p2) + '. ¿Cuánto cuestan las dos cosas juntas?', p1 + p2, '', fmtM(p1) + ' + ' + fmtM(p2) + ' = ' + fmtM(p1 + p2) + '.', null, true); }
      if (g <= 7) { var q1 = r.i(2, 5), pr1 = r.i(20, 45) * 100, q2 = r.i(2, 6), pr2 = r.i(5, 30) * 100; return P(nm + ' compra ' + q1 + ' libras de arroz a ' + fmtM(pr1) + ' y ' + q2 + ' panelas a ' + fmtM(pr2) + '. ¿Cuánto paga en total?', q1 * pr1 + q2 * pr2, '', q1 + ' × ' + fmtM(pr1) + ' + ' + q2 + ' × ' + fmtM(pr2) + ' = ' + fmtM(q1 * pr1) + ' + ' + fmtM(q2 * pr2) + ' = ' + fmtM(q1 * pr1 + q2 * pr2) + '.', null, true); }
      var u = r.i(12, 30) * 100, paq = 6 * u - r.i(2, 8) * 100; return P('Una gaseosa cuesta ' + fmtM(u) + ', pero el paquete de 6 cuesta ' + fmtM(paq) + '. ¿Cuánto se ahorra al comprar el paquete en vez de 6 sueltas?', 6 * u - paq, '', '6 × ' + fmtM(u) + ' = ' + fmtM(6 * u) + '; ahorro: ' + fmtM(6 * u) + ' − ' + fmtM(paq) + ' = ' + fmtM(6 * u - paq) + '.', null, true);
    } },
    { id: 'feria', f: function (r, g, nm) {
      if (g <= 1) { var a = r.i(2, g ? 40 : 5), b = r.i(1, g ? 40 : 5); return P('En el desfile de la Feria de Cali pasaron ' + a + ' caballos y ' + b + ' comparsas. ¿Cuántos grupos pasaron en total?', a + b, '', a + ' + ' + b + ' = ' + (a + b) + '.'); }
      if (g <= 4) { var p = r.i(8, 40) * 1000, n = r.i(2, 9); return P('Una boleta para el Salsódromo de la Feria de Cali cuesta ' + fmtM(p) + '. ¿Cuánto pagan ' + n + ' personas?', n * p, '', n + ' × ' + fmtM(p) + ' = ' + fmtM(n * p) + '.', null, true); }
      if (g <= 7) { var N = r.i(10, 60) * 1000, pc = r.p([10, 20, 25, 30, 40]); return P('Al Salsódromo asistieron ' + fmtN(N) + ' personas y el ' + pc + ' % eran turistas. ¿Cuántos turistas asistieron?', N * pc / 100, 'turistas', fmtN(N) + ' × ' + pc + ' ÷ 100 = ' + fmtN(N * pc / 100) + '.'); }
      var pb = r.i(40, 150) * 1000, d = r.p([10, 15, 20, 25, 30]); return P('Una boleta para un concierto de la Feria cuesta ' + fmtM(pb) + ' y tiene un descuento del ' + d + ' % en preventa. ¿Cuánto se paga en preventa?', pb * (100 - d) / 100, '', 'Descuento: ' + fmtM(pb * d / 100) + '. Precio: ' + fmtM(pb) + ' × ' + (100 - d) + ' % = ' + fmtM(pb * (100 - d) / 100) + '.', null, true);
    } },
    { id: 'pance', f: function (r, g, nm) {
      if (g <= 1) { var a = r.i(1, g ? 50 : 5), b = r.i(1, g ? 40 : 4); return P('En el río Pance ' + nm + ' encontró ' + a + ' piedras lisas y luego ' + b + ' más. ¿Cuántas piedras tiene?', a + b, 'piedras', a + ' + ' + b + ' = ' + (a + b) + '.'); }
      if (g <= 3) { var m1 = r.i(120, 480), m2 = r.i(100, 480); return P('Desde el parqueadero hasta el charco del río Pance caminamos ' + m1 + ' m, y luego ' + m2 + ' m hasta la cascada. ¿Cuántos metros caminamos?', m1 + m2, 'm', m1 + ' + ' + m2 + ' = ' + (m1 + m2) + ' m.'); }
      if (g <= 6) { var v = r.i(2, 5), h = r.i(2, 6); return P('Una familia camina por el sendero del río Pance a ' + v + ' km por hora. ¿Cuántos kilómetros recorre en ' + h + ' horas?', v * h, 'km', 'Distancia = velocidad × tiempo = ' + v + ' × ' + h + ' = ' + (v * h) + ' km.'); }
      var vel = r.p([12, 16, 18, 20, 24]), t = r.p([0.5, 1.5, 2, 2.5, 3]); return P('Una ciclista va de Cali al río Pance a ' + vel + ' km/h y recorre ' + fmtN(vel * t) + ' km. ¿Cuántas horas tarda?', t, 'h', 'Tiempo = distancia ÷ velocidad = ' + fmtN(vel * t) + ' ÷ ' + vel + ' = ' + fmtN(t) + ' h.');
    } },
    { id: 'cancha', f: function (r, g, nm) {
      if (g <= 2) { var a = r.i(1, g ? 9 : 4), b = r.i(1, g ? 9 : 4); return P('En la cancha del colegio el equipo azul hizo ' + a + ' goles y el equipo naranja ' + b + '. ¿Cuántos goles hubo en el partido?', a + b, 'goles', a + ' + ' + b + ' = ' + (a + b) + '.', g === 0 ? { svg: svgSuma('balon', a, b) } : null); }
      var L = r.i(20, 45), A = r.i(10, L - 4);
      if (g <= 4) return P('La cancha del colegio mide ' + L + ' m de largo y ' + A + ' m de ancho. ¿Cuántos metros recorre ' + nm + ' si le da una vuelta completa por el borde?', 2 * (L + A), 'm', 'Perímetro = ' + L + ' + ' + A + ' + ' + L + ' + ' + A + ' = ' + (2 * (L + A)) + ' m.');
      if (g <= 8) return P('Se va a poner grama sintética en la cancha del colegio, que mide ' + L + ' m por ' + A + ' m. ¿Cuántos metros cuadrados de grama se necesitan?', L * A, 'm²', 'Área = largo × ancho = ' + L + ' × ' + A + ' = ' + (L * A) + ' m².');
      var tr = r.p([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = tr[0] === 3 ? r.i(6, 10) : r.i(2, 3); return P('La cancha del colegio mide ' + (tr[1] * k) + ' m por ' + (tr[0] * k) + ' m. ¿Cuánto mide la diagonal de esquina a esquina?', tr[2] * k, 'm', 'Pitágoras: d = √(' + (tr[1] * k) + '² + ' + (tr[0] * k) + '²) = √' + (tr[2] * k * tr[2] * k) + ' = ' + (tr[2] * k) + ' m.');
    } },
    { id: 'alcancia', f: function (r, g, nm) {
      if (g <= 1) { var a = r.i(1, g ? 30 : 5), b = r.i(1, g ? 30 : 4); return P(nm + ' tenía ' + a + ' monedas en la alcancía y metió ' + b + ' más. ¿Cuántas monedas tiene?', a + b, 'monedas', a + ' + ' + b + ' = ' + (a + b) + '.'); }
      if (g <= 4) { var p = r.i(2, 10) * 500, w = r.i(3, 12); return P(nm + ' ahorra ' + fmtM(p) + ' cada semana. ¿Cuánto tendrá ahorrado en ' + w + ' semanas?', p * w, '', w + ' × ' + fmtM(p) + ' = ' + fmtM(p * w) + '.', null, true); }
      if (g <= 8) { var ps = r.i(2, 10) * 1000, sem = r.i(6, 20); return P(nm + ' quiere comprar unos guayos de ' + fmtM(ps * sem) + ' y ahorra ' + fmtM(ps) + ' por semana. ¿Cuántas semanas necesita?', sem, 'semanas', fmtM(ps * sem) + ' ÷ ' + fmtM(ps) + ' = ' + sem + ' semanas.'); }
      var Cc = r.i(2, 20) * 100000, i = r.p([4, 5, 6, 8, 10, 12]), t = r.i(2, 5); return P(nm + ' deposita ' + fmtM(Cc) + ' en una cuenta de ahorros con interés simple del ' + i + ' % anual. ¿Cuánto interés gana en ' + t + ' años?', Cc * i * t / 100, '', 'I = C · i · t = ' + fmtM(Cc) + ' × ' + i + '/100 × ' + t + ' = ' + fmtM(Cc * i * t / 100) + '.', null, true);
    } },
    { id: 'temperatura', gmin: 3, f: function (r, g, nm) {
      if (g <= 6) { var mx = r.i(28, 34), mn = r.i(17, 22); return P('Un día en Cali la temperatura máxima fue ' + mx + ' °C y la mínima ' + mn + ' °C. ¿Cuál fue la diferencia?', mx - mn, '°C', mx + ' − ' + mn + ' = ' + (mx - mn) + ' °C.'); }
      var a = r.i(-4, -1), b = r.i(8, 16); return P('En la madrugada, en la parte más alta de los Farallones de Cali, hubo ' + sg(a) + ' °C y al mediodía ' + b + ' °C. ¿Cuántos grados subió la temperatura?', b - a, '°C', b + ' − ' + par(a) + ' = ' + b + ' + ' + (-a) + ' = ' + (b - a) + ' °C.');
    } },
    { id: 'promedio', gmin: 4, f: function (r, g, nm) {
      var n = r.i(3, 5), arr = [], s = 0; for (var i = 0; i < n; i++) { var v = r.i(0, 6); arr.push(v); s += v; }
      var fal = (n - s % n) % n; arr[n - 1] += fal; s += fal;
      return P('En el torneo de la cancha del colegio, el equipo de ' + nm + ' hizo estos goles en ' + n + ' partidos: ' + arr.join(', ') + '. ¿Cuál es el promedio de goles por partido?', s / n, 'goles', 'Promedio = suma ÷ cantidad = ' + s + ' ÷ ' + n + ' = ' + fmtN(s / n) + '.');
    } },
    { id: 'pasaje', gmin: 2, f: function (r, g, nm) {
      var p = r.p([2700, 2800, 2900, 3000, 3200]);
      if (g <= 6) { var v = r.i(2, 12); return P('Si un pasaje del MIO costara ' + fmtM(p) + ', ¿cuánto gastaría ' + nm + ' en ' + v + ' viajes?', p * v, '', v + ' × ' + fmtM(p) + ' = ' + fmtM(p * v) + '.', null, true); }
      var rec = r.i(2, 10) * 10000, vj = Math.floor(rec / p); return P(nm + ' recarga su tarjeta del MIO con ' + fmtM(rec) + '. Si cada pasaje cuesta ' + fmtM(p) + ', ¿cuántos viajes completos puede hacer?', vj, 'viajes', fmtM(rec) + ' ÷ ' + fmtM(p) + ' ≈ ' + fmtN(rec / p, 2) + '; solo cuentan los viajes completos: ' + vj + '.');
    } },
    { id: 'huerta', gmin: 1, f: function (r, g, nm) {
      if (g <= 3) { var f = r.i(2, g === 1 ? 3 : 8), c = r.i(2, g === 1 ? 5 : 9); if (g === 1) return P('En la huerta escolar hay ' + f + ' surcos con ' + c + ' matas de cilantro cada uno. Si cuentas de ' + c + ' en ' + c + ', ¿cuántas matas hay?', f * c, 'matas', 'Contamos de ' + c + ' en ' + c + ' ' + f + ' veces: ' + (f * c) + '.'); return P('En la huerta escolar hay ' + f + ' surcos con ' + c + ' matas de cilantro cada uno. ¿Cuántas matas hay?', f * c, 'matas', f + ' × ' + c + ' = ' + (f * c) + '.'); }
      var L = r.i(3, 12), A = r.i(2, 8), k = r.p([2, 3, 4]); return P('Un cantero de la huerta mide ' + L + ' m por ' + A + ' m y en cada metro cuadrado se siembran ' + k + ' plantas de tomate. ¿Cuántas plantas caben?', L * A * k, 'plantas', 'Área: ' + L + ' × ' + A + ' = ' + (L * A) + ' m²; plantas: ' + (L * A) + ' × ' + k + ' = ' + (L * A * k) + '.');
    } }
  ];

  /* ------------------------------------------------------------------ *
   * 8. Tipo: SERIES Y PATRONES
   * ------------------------------------------------------------------ */
  var FORMAS = {
    circulo: { n: 'círculo', d: function (x, y, c) { return '<circle cx="' + x + '" cy="' + y + '" r="15" fill="' + c + '" stroke="#222" stroke-width="2"/>'; } },
    cuadrado: { n: 'cuadrado', d: function (x, y, c) { return '<rect x="' + (x - 14) + '" y="' + (y - 14) + '" width="28" height="28" fill="' + c + '" stroke="#222" stroke-width="2"/>'; } },
    triangulo: { n: 'triángulo', d: function (x, y, c) { return '<polygon points="' + x + ',' + (y - 17) + ' ' + (x + 16) + ',' + (y + 13) + ' ' + (x - 16) + ',' + (y + 13) + '" fill="' + c + '" stroke="#222" stroke-width="2"/>'; } },
    estrella: { n: 'estrella', d: function (x, y, c) { return star(x, y, 18, 8, c, '#222'); } },
    corazon: { n: 'corazón', d: function (x, y, c) { return '<path d="M' + x + ' ' + (y + 15) + ' C' + (x - 22) + ' ' + (y + 1) + ' ' + (x - 14) + ' ' + (y - 18) + ' ' + x + ' ' + (y - 7) + ' C' + (x + 14) + ' ' + (y - 18) + ' ' + (x + 22) + ' ' + (y + 1) + ' ' + x + ' ' + (y + 15) + 'Z" fill="' + c + '" stroke="#222" stroke-width="2"/>'; } }
  };
  var COLS = [['rojo', '#E2493B'], ['azul', '#2F6FD6'], ['amarillo', '#F5C518'], ['verde', '#2EA05A']];
  function elemNombre(e) { return FORMAS[e.f].n + ' ' + (FORMAS[e.f].n === 'estrella' ? (e.c[0] === 'rojo' ? 'roja' : e.c[0] === 'amarillo' ? 'amarilla' : e.c[0]) : e.c[0]); }
  function elemSvg(e, size) { return svg(40, 40, FORMAS[e.f].d(20, 20, e.c[1]), elemNombre(e), size || 44); }
  function svgPatron(seq) {
    var s = '', W = seq.length * 42 + 50;
    seq.forEach(function (e, i) { s += FORMAS[e.f].d(24 + i * 42, 24, e.c[1]); });
    var x = 24 + seq.length * 42;
    s += '<rect x="' + (x - 17) + '" y="7" width="34" height="34" rx="6" fill="#fff" stroke="' + C.orange + '" stroke-width="2.5" stroke-dasharray="5 3"/>' + T(x, 31, '?', 22, 'font-weight="800" fill="' + C.orange + '"');
    return svg(W, 48, s, 'Patrón de figuras', W);
  }
  function serieTxt(arr, fmt) { return arr.map(fmt || fmtN).join(', ') + ', ___'; }
  var SERIES = {
    patron: function (r, g) {
      var tipos = ['AB', 'AAB', 'ABB', 'ABC', 'AABB'];
      var t = r.p(g === 0 ? ['AB', 'AAB', 'ABB', 'AB'] : tipos);
      var fs = r.sh(Object.keys(FORMAS)), cs = r.sh(COLS);
      var el = { A: { f: fs[0], c: cs[0] }, B: { f: fs[1], c: cs[1] }, C: { f: fs[2], c: cs[2] } };
      var len = r.i(t.length * 2, Math.min(t.length * 2 + 2, 7)), seq = [];
      for (var i = 0; i < len; i++) seq.push(el[t.charAt(i % t.length)]);
      var nxt = el[t.charAt(len % t.length)];
      var cands = [el.A, el.B, el.C, { f: fs[3], c: cs[3] }];
      var otras = cands.filter(function (e) { return e !== nxt; });
      otras = r.sh(otras).slice(0, 2);
      return opc('Mira el patrón. ¿Qué figura sigue?', { v: elemNombre(nxt), html: elemSvg(nxt) + '<span>' + esc(elemNombre(nxt)) + '</span>' },
        otras.map(function (e) { return { v: elemNombre(e), html: elemSvg(e) + '<span>' + esc(elemNombre(e)) + '</span>' }; }),
        'El patrón se repite así: ' + t.split('').join('-') + '. Después de la última figura viene: ' + elemNombre(nxt) + '.', { svg: svgPatron(seq) }, r);
    },
    contar: function (r, g) { var a = r.i(1, 6), d = 1; var arr = [a, a + 1, a + 2]; return it(serieTxt(arr) + '  ¿Qué número sigue?', a + 3, 'Contamos de uno en uno: después del ' + (a + 2) + ' viene el ' + (a + 3) + '.', { num: a + 3 }); },
    suma: function (r, g) {
      var d = g <= 1 ? r.p([1, 2, 5, 10]) : g === 2 ? r.p([2, 3, 4, 5, 10, 25, 100]) : r.i(3, 25), a = r.i(0, g <= 1 ? 20 : 200), n = r.i(4, 5), arr = [];
      if (r.b(g <= 1 ? 0.3 : 0.4)) { a = a + d * (n + 1) + r.i(0, 10); d = -d; }
      for (var i = 0; i < n; i++) arr.push(a + d * i);
      var nx = a + d * n; return it(serieTxt(arr) + '  ¿Qué número sigue?', nx, 'Cada número ' + (d > 0 ? 'aumenta ' : 'disminuye ') + Math.abs(d) + '. ' + fmtN(arr[n - 1]) + (d > 0 ? ' + ' : ' − ') + Math.abs(d) + ' = ' + fmtN(nx) + '.', { num: nx });
    },
    hueco: function (r, g) { var d = r.p([2, 3, 4, 5, 10, 20, 50]), a = r.i(1, 100), arr = [a, a + d, a + 2 * d, a + 3 * d, a + 4 * d], k = r.i(1, 3), ans = arr[k]; var txt = arr.map(function (v, i) { return i === k ? '▢' : fmtN(v); }).join(', '); return it(txt + '  ¿Qué número va en el cuadro?', ans, 'La serie aumenta de ' + d + ' en ' + d + ': ' + fmtN(arr[k - 1]) + ' + ' + d + ' = ' + fmtN(ans) + '.', { num: ans }); },
    mult: function (r, g) { var m = r.p([2, 3, 4, 5, 10]), a = r.i(1, m >= 4 ? 3 : 5), arr = [a, a * m, a * m * m, a * m * m * m]; var nx = a * Math.pow(m, 4); return it(serieTxt(arr) + '  ¿Qué número sigue?', nx, 'Cada número se multiplica por ' + m + ': ' + fmtN(arr[3]) + ' × ' + m + ' = ' + fmtN(nx) + '.', { num: nx }); },
    alterna: function (r, g) { var p = r.i(3, 12), q = r.i(1, p - 1), a = r.i(5, 60), arr = [a], i; for (i = 1; i < 6; i++) arr.push(arr[i - 1] + (i % 2 ? p : -q)); var nx = arr[5] + (6 % 2 ? p : -q); return it(serieTxt(arr) + '  ¿Qué número sigue?', nx, 'La regla alterna: +' + p + ', −' + q + ', +' + p + ', −' + q + '… Ahora toca ' + (6 % 2 ? '+' + p : '−' + q) + ': ' + nx + '.', { num: nx }); },
    cuadrados: function (r, g) { var a = r.i(1, 6), arr = []; for (var i = a; i < a + 5; i++) arr.push(i * i); var nx = (a + 5) * (a + 5); return it(serieTxt(arr) + '  ¿Qué número sigue?', nx, 'Son cuadrados perfectos: ' + a + '², ' + (a + 1) + '², … El siguiente es ' + (a + 5) + '² = ' + nx + '.', { num: nx }); },
    difcrece: function (r, g) { var a = r.i(1, 20), d = r.i(1, 4), arr = [a], i; for (i = 1; i < 5; i++) arr.push(arr[i - 1] + d + (i - 1)); var nx = arr[4] + d + 4; return it(serieTxt(arr) + '  ¿Qué número sigue?', nx, 'Las diferencias crecen de 1 en 1: +' + d + ', +' + (d + 1) + ', +' + (d + 2) + ', +' + (d + 3) + '; ahora +' + (d + 4) + ' = ' + nx + '.', { num: nx }); },
    triangulares: function (r, g) { var arr = [1, 3, 6, 10, 15, 21, 28, 36, 45], k = r.i(4, 6); var s = arr.slice(0, k); return it(serieTxt(s) + '  (números triangulares) ¿Qué número sigue?', arr[k], 'Se suma 2, 3, 4, … El siguiente se obtiene sumando ' + (k + 1) + ': ' + arr[k - 1] + ' + ' + (k + 1) + ' = ' + arr[k] + '.', { num: arr[k] }); },
    decimal: function (r, g) { var d = r.p([0.5, 0.25, 0.2, 1.5]), a = r.i(0, 10), arr = []; for (var i = 0; i < 4; i++) arr.push(r2(a + d * i)); var nx = r2(a + d * 4); return it(serieTxt(arr) + '  ¿Qué número sigue?', fmtN(nx), 'Cada término aumenta ' + fmtN(d) + ': ' + fmtN(arr[3]) + ' + ' + fmtN(d) + ' = ' + fmtN(nx) + '.', { num: nx }); },
    enteros: function (r, g) { var d = r.nz(-9, 9), a = r.i(-15, 15), arr = []; for (var i = 0; i < 5; i++) arr.push(a + d * i); var nx = a + 5 * d; return it(serieTxt(arr, sg) + '  ¿Qué número sigue?', sg(nx), 'La diferencia constante es ' + sg(d) + ': ' + sg(arr[4]) + ' + ' + par(d) + ' = ' + sg(nx) + '.', { num: nx }); },
    geoNeg: function (r, g) { var m = r.p([-2, -3]), a = r.nz(-3, 3), arr = [a, a * m, a * m * m, a * m * m * m]; var nx = a * Math.pow(m, 4); return it(serieTxt(arr, sg) + '  ¿Qué número sigue?', sg(nx), 'Cada término se multiplica por ' + par(m) + ' (por eso el signo alterna): ' + sg(arr[3]) + ' × ' + par(m) + ' = ' + sg(nx) + '.', { num: nx }); },
    reglaArit: function (r, g) { var d = r.nz(-6, 9), a1 = r.i(-10, 15), arr = []; for (var i = 0; i < 4; i++) arr.push(a1 + d * i); var p = {}; p[1] = d; p[0] = a1 - d; return it(serieTxt(arr, sg).replace(', ___', ', …') + '  Escribe el término general aₙ.', 'aₙ = ' + polyTxt(p, 'n'), 'Es aritmética con a₁ = ' + sg(a1) + ' y d = ' + sg(d) + ': aₙ = a₁ + (n − 1)·d = ' + sg(a1) + ' + (n − 1)·' + par(d) + ' = ' + polyTxt(p, 'n') + '.', { poly: p, ayuda: 'Ej.: 3n + 2' }); },
    terminoN: function (r, g) { var d = r.nz(-5, 9), a1 = r.i(-10, 20), n = r.i(10, 40), arr = []; for (var i = 0; i < 4; i++) arr.push(a1 + d * i); var v = a1 + (n - 1) * d; return it(serieTxt(arr, sg).replace(', ___', ', …') + '  ¿Cuál es el término número ' + n + '?', sg(v), 'aₙ = a₁ + (n − 1)·d = ' + sg(a1) + ' + ' + (n - 1) + '·' + par(d) + ' = ' + sg(v) + '.', { num: v }); },
    geoN: function (r, g) { var q = r.p([2, 3]), a1 = r.i(1, 5), n = r.i(5, q === 2 ? 10 : 7), arr = [a1, a1 * q, a1 * q * q]; var v = a1 * Math.pow(q, n - 1); return it(serieTxt(arr).replace(', ___', ', …') + '  ¿Cuál es el término número ' + n + '?', fmtN(v), 'Es geométrica con razón r = ' + q + ': aₙ = a₁·rⁿ⁻¹ = ' + a1 + '·' + q + supTxt(n - 1) + ' = ' + fmtN(v) + '.', { num: v }); },
    razon: function (r, g) { var num = r.p([1, 1, 2, 3]), den = r.p([2, 3, 4]); if (num >= den) num = 1; var q = F(num, den); var a1 = Math.pow(den, 3) * r.i(1, 2); var arr = [a1, a1 * num / den, a1 * num * num / den / den, a1 * Math.pow(num, 3) / Math.pow(den, 3)]; return it(arr.map(fmtN).join(', ') + ', …  ¿Cuál es la razón r de esta sucesión geométrica?', fStr(q), 'r = a₂ ÷ a₁ = ' + fmtN(arr[1]) + ' ÷ ' + fmtN(arr[0]) + ' = ' + fStr(q) + '.', { num: fVal(q) }); },
    sumaArit: function (r, g) { var a1 = r.i(1, 20), d = r.i(1, 9), n = r.i(10, 30); var an = a1 + (n - 1) * d, S = n * (a1 + an) / 2; return it('Suma los primeros ' + n + ' términos de: ' + a1 + ', ' + (a1 + d) + ', ' + (a1 + 2 * d) + ', …', fmtN(S), 'aₙ = ' + a1 + ' + ' + (n - 1) + '·' + d + ' = ' + an + '. Sₙ = n(a₁ + aₙ)/2 = ' + n + '·(' + a1 + ' + ' + an + ')/2 = ' + fmtN(S) + '.', { num: S }); },
    fibo: function (r, g) { var a = r.i(1, 5), b = r.i(a, 8), arr = [a, b], i; for (i = 2; i < 6; i++) arr.push(arr[i - 1] + arr[i - 2]); var nx = arr[5] + arr[4]; return it(serieTxt(arr) + '  ¿Qué número sigue?', nx, 'Cada término es la suma de los dos anteriores (tipo Fibonacci): ' + arr[4] + ' + ' + arr[5] + ' = ' + nx + '.', { num: nx }); }
  };
  var SERIES_G = [
    ['patron', 'patron', 'contar'], ['patron', 'suma', 'patron', 'contar'], ['suma', 'hueco', 'patron'], ['suma', 'hueco', 'mult', 'alterna'],
    ['mult', 'alterna', 'suma', 'difcrece'], ['cuadrados', 'difcrece', 'mult', 'alterna', 'triangulares'], ['cuadrados', 'triangulares', 'decimal', 'difcrece', 'mult'],
    ['enteros', 'geoNeg', 'decimal', 'cuadrados', 'difcrece'], ['reglaArit', 'terminoN', 'enteros', 'geoNeg'], ['reglaArit', 'terminoN', 'geoN', 'cuadrados'],
    ['geoN', 'razon', 'sumaArit', 'terminoN', 'fibo'], ['geoN', 'razon', 'sumaArit', 'reglaArit', 'fibo']
  ];

  /* ------------------------------------------------------------------ *
   * 9. Tipo: GEOMETRÍA VISUAL
   * ------------------------------------------------------------------ */
  var GEO = {
    nombre: function (r, g) {
      var keys = g === 0 ? ['circulo', 'cuadrado', 'triangulo', 'rectangulo'] : ['circulo', 'cuadrado', 'triangulo', 'rectangulo', 'pentagono', 'hexagono', 'rombo', 'octagono'];
      var k = r.p(keys), f = FIG[k];
      var otras = r.sh(keys.filter(function (x) { return x !== k; })).slice(0, 2).map(function (x) { return FIG[x].n; });
      return opc('¿Cómo se llama esta figura?', f.n, otras, 'Es un ' + f.n + (f.lados ? ': tiene ' + f.lados + ' lados.' : ': es redondo y no tiene lados rectos ni esquinas.'), { svg: svg(200, 130, f.d(100, 65, r.p(RELL)), f.n, 200) }, r);
    },
    contarFig: function (r, g) {
      var objetivo = r.p(['triangulo', 'circulo', 'cuadrado']), keys = ['triangulo', 'circulo', 'cuadrado'], s = '', cnt = 0, n = r.i(5, 8);
      for (var i = 0; i < n; i++) {
        var k = i < 2 ? objetivo : r.p(keys); if (k === objetivo) cnt++;
        var x = 34 + (i % 4) * 76, y = 34 + Math.floor(i / 4) * 70, col = r.p(RELL);
        if (k === 'circulo') s += '<circle cx="' + x + '" cy="' + y + '" r="24" fill="' + col + '" stroke="' + C.ink + '" stroke-width="2"/>';
        else if (k === 'cuadrado') s += '<rect x="' + (x - 22) + '" y="' + (y - 22) + '" width="44" height="44" fill="' + col + '" stroke="' + C.ink + '" stroke-width="2"/>';
        else s += regPoly(x, y + 5, 28, 3, col, C.ink, 2);
      }
      return it('¿Cuántos ' + (objetivo === 'circulo' ? 'círculos' : objetivo === 'cuadrado' ? 'cuadrados' : 'triángulos') + ' hay?', cnt, 'Señala con el dedo solo los ' + FIG[objetivo].n + 's y cuéntalos: ' + cnt + '.', { num: cnt, svg: svg(310, 140, s, 'figuras mezcladas', 310) });
    },
    lados: function (r, g) {
      var k = r.p(['triangulo', 'cuadrado', 'rectangulo', 'pentagono', 'hexagono', 'octagono', 'rombo']), f = FIG[k], q = r.b() ? 'lados' : 'vértices (esquinas)';
      return it('¿Cuántos ' + q + ' tiene este ' + f.n + '?', f.lados, 'Un ' + f.n + ' tiene ' + f.lados + ' lados y ' + f.lados + ' vértices: en un polígono hay tantos vértices como lados.', { num: f.lados, svg: svg(200, 130, f.d(100, 65, r.p(RELL)), f.n, 200) });
    },
    simetria: function (r, g) {
      var casos = [
        { d: FIG.rectangulo.d(110, 70, RELL[1]), l: [110, 20, 110, 120], ok: true, por: 'divide el rectángulo en dos mitades iguales que coinciden al doblar' },
        { d: FIG.rectangulo.d(110, 70, RELL[1]), l: [48, 36, 172, 104], ok: false, por: 'la diagonal de un rectángulo (que no es cuadrado) no hace coincidir las mitades al doblar' },
        { d: FIG.cuadrado.d(110, 70, RELL[2]), l: [68, 28, 152, 112], ok: true, por: 'en el cuadrado la diagonal sí es eje de simetría' },
        { d: regPoly(110, 78, 56, 3, RELL[0], C.ink, 2.5), l: [110, 14, 110, 120], ok: true, por: 'pasa por un vértice y por la mitad del lado opuesto del triángulo equilátero' },
        { d: '<polygon points="50,110 170,110 170,30" fill="' + RELL[3] + '" stroke="' + C.ink + '" stroke-width="2.5"/>', l: [110, 20, 110, 120], ok: false, por: 'las dos partes del triángulo rectángulo no son iguales' },
        { d: FIG.circulo.d(110, 70, RELL[4]), l: [50, 70, 170, 70], ok: true, por: 'cualquier línea que pase por el centro del círculo es eje de simetría' },
        { d: '<path d="M60 40 h100 v30 h-60 v40 h-40 z" fill="' + RELL[5] + '" stroke="' + C.ink + '" stroke-width="2.5"/>', l: [110, 20, 110, 125], ok: false, por: 'la figura en forma de L no queda igual a ambos lados' }
      ];
      if (g >= 3 && r.b(0.5)) {
        var ej = r.p([['cuadrado', 4], ['rectangulo', 2], ['triangulo', 3], ['hexagono', 6], ['pentagono', 5]]);
        return it('¿Cuántos ejes de simetría tiene este ' + FIG[ej[0]].n + (ej[0] === 'triangulo' ? ' equilátero' : ej[0] === 'hexagono' || ej[0] === 'pentagono' ? ' regular' : '') + '?', ej[1], 'Un eje de simetría divide la figura en dos mitades que coinciden al doblar. Este ' + FIG[ej[0]].n + ' tiene ' + ej[1] + '.', { num: ej[1], svg: svg(200, 130, FIG[ej[0]].d(100, 65, r.p(RELL)), FIG[ej[0]].n, 200) });
      }
      var c = r.p(casos);
      return opc('¿La línea punteada es un eje de simetría de la figura?', c.ok ? 'Sí' : 'No', ['Sí', 'No'], (c.ok ? 'Sí: ' : 'No: ') + c.por + '.', { svg: svg(220, 140, c.d + '<line x1="' + c.l[0] + '" y1="' + c.l[1] + '" x2="' + c.l[2] + '" y2="' + c.l[3] + '" stroke="' + C.red + '" stroke-width="3" stroke-dasharray="8 5"/>', 'figura con línea punteada', 220) }, r);
    },
    malla: function (r, g, modo) {
      var cols = 11, rows = 7, cs = 26, w = r.i(3, 8), h = r.i(2, 5), L = r.b(0.5) && w >= 4 && h >= 3, a = L ? r.i(1, w - 2) : 0, b = L ? r.i(1, h - 1) : 0;
      var x0 = 1 + Math.floor((cols - w) / 2), y0 = 1 + Math.floor((rows - h) / 2), s = '';
      for (var i = 0; i <= cols; i++) s += '<line x1="' + (i * cs + 2) + '" y1="2" x2="' + (i * cs + 2) + '" y2="' + (rows * cs + 2) + '" stroke="#B9C7DA" stroke-width="1"/>';
      for (var j = 0; j <= rows; j++) s += '<line x1="2" y1="' + (j * cs + 2) + '" x2="' + (cols * cs + 2) + '" y2="' + (j * cs + 2) + '" stroke="#B9C7DA" stroke-width="1"/>';
      var X = function (c) { return (x0 + c) * cs + 2; }, Y = function (c) { return (y0 + c) * cs + 2; };
      var pts = L ? [[0, 0], [w - a, 0], [w - a, b], [w, b], [w, h], [0, h]] : [[0, 0], [w, 0], [w, h], [0, h]];
      s += '<polygon points="' + pts.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '" fill="rgba(6,79,174,.18)" stroke="' + C.navy + '" stroke-width="3.5" stroke-linejoin="round"/>';
      var fig = svg(cols * cs + 4, rows * cs + 4, s, 'figura en cuadrícula', 300);
      var per = 2 * (w + h), area = w * h - a * b;
      if (modo === 'area') return it('Cada cuadrito mide 1 cm × 1 cm. ¿Cuál es el área de la figura?', area + ' cm²', 'Cuenta los cuadritos de adentro: ' + (L ? w + ' × ' + h + ' − ' + a + ' × ' + b + ' = ' : w + ' × ' + h + ' = ') + area + ' cm².', { num: area, svg: fig });
      return it('Cada cuadrito mide 1 cm de lado. ¿Cuál es el perímetro de la figura?', per + ' cm', 'Recorre todo el borde contando lados de cuadrito: ' + (L ? 'en esta figura en L ' : '') + 'el perímetro es ' + per + ' cm.', { num: per, svg: fig });
    },
    areaRect: function (r, g) { var b = r.i(3, 15), h = r.i(2, 10), u = r.p(['cm', 'm']), sc = Math.min(200 / b, 100 / h), W = b * sc, H = h * sc, x = (260 - W) / 2, y = 15; var s = '<rect x="' + x + '" y="' + y + '" width="' + W + '" height="' + H + '" fill="' + RELL[1] + '" stroke="' + C.ink + '" stroke-width="2.5"/>' + cota(x, y + H, x + W, y + H, b + ' ' + u, 20) + cota(x + W, y, x + W, y + H, h + ' ' + u, 5).replace('text-anchor="middle"', 'text-anchor="start"').replace('x="' + (x + W) + '"', 'x="' + (x + W + 6) + '"'); return it('¿Cuál es el área del rectángulo?', b * h + ' ' + u + '²', 'Área del rectángulo = base × altura = ' + b + ' × ' + h + ' = ' + (b * h) + ' ' + u + '².', { num: b * h, svg: svg(320, H + 45, s, 'rectángulo ' + b + ' por ' + h, 320) }); },
    areaTri: function (r, g) { var b = 2 * r.i(2, 9), h = r.i(3, 10), sc = Math.min(200 / b, 100 / h), W = b * sc, H = h * sc, x = (260 - W) / 2, y = 15, px = x + W * r.p([0.3, 0.5, 0.65]); var s = '<polygon points="' + x + ',' + (y + H) + ' ' + (x + W) + ',' + (y + H) + ' ' + px + ',' + y + '" fill="' + RELL[0] + '" stroke="' + C.ink + '" stroke-width="2.5"/><line x1="' + px + '" y1="' + y + '" x2="' + px + '" y2="' + (y + H) + '" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="6 4"/>' + marcaRecto(px, y + H, 1, -1, 10) + cota(x, y + H, x + W, y + H, 'b = ' + b + ' cm', 20) + '<text x="' + (px + 8) + '" y="' + (y + H / 2 + 5) + '" font-size="15" font-weight="700" font-family="Public Sans, Arial, sans-serif" fill="' + C.red + '">h = ' + h + ' cm</text>'; return it('¿Cuál es el área del triángulo?', fmtN(b * h / 2) + ' cm²', 'Área del triángulo = base × altura ÷ 2 = ' + b + ' × ' + h + ' ÷ 2 = ' + fmtN(b * h / 2) + ' cm².', { num: b * h / 2, svg: svg(320, H + 45, s, 'triángulo', 320) }); },
    areaComp: function (r, g) {
      if (r.b()) { // casa: rectángulo + triángulo
        var b = 2 * r.i(3, 8), h1 = r.i(3, 7), h2 = r.i(2, 5), sc = Math.min(180 / b, 120 / (h1 + h2)), W = b * sc, x = (260 - W) / 2, yT = 12, yR = yT + h2 * sc, H = (h1 + h2) * sc;
        var s = '<polygon points="' + x + ',' + yR + ' ' + (x + W) + ',' + yR + ' ' + (x + W / 2) + ',' + yT + '" fill="' + RELL[0] + '" stroke="' + C.ink + '" stroke-width="2.5"/><rect x="' + x + '" y="' + yR + '" width="' + W + '" height="' + (h1 * sc) + '" fill="' + RELL[1] + '" stroke="' + C.ink + '" stroke-width="2.5"/>' + cota(x, yT + H, x + W, yT + H, b + ' m', 20) + '<text x="' + (x + W + 6) + '" y="' + (yR + h1 * sc / 2 + 5) + '" font-size="15" font-weight="700" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '">' + h1 + ' m</text><line x1="' + (x + W / 2) + '" y1="' + yT + '" x2="' + (x + W / 2) + '" y2="' + yR + '" stroke="' + C.red + '" stroke-dasharray="5 4" stroke-width="2"/><text x="' + (x + W / 2 + 6) + '" y="' + (yT + h2 * sc / 2 + 10) + '" font-size="14" font-weight="700" font-family="Public Sans, Arial, sans-serif" fill="' + C.red + '">' + h2 + ' m</text>';
        var A = b * h1 + b * h2 / 2;
        return it('La fachada de la casa está formada por un rectángulo y un triángulo. ¿Cuál es su área total?', fmtN(A) + ' m²', 'Rectángulo: ' + b + ' × ' + h1 + ' = ' + (b * h1) + ' m². Triángulo: ' + b + ' × ' + h2 + ' ÷ 2 = ' + fmtN(b * h2 / 2) + ' m². Total: ' + fmtN(A) + ' m².', { num: A, svg: svg(320, H + 45, s, 'figura compuesta', 320) });
      }
      var w = r.i(6, 12), h = r.i(5, 9), a = r.i(2, w - 3), c = r.i(2, h - 2), sc2 = Math.min(200 / w, 120 / h), x0 = 40, y0 = 12, X = function (v) { return x0 + v * sc2; }, Y = function (v) { return y0 + v * sc2; };
      var pts = [[0, 0], [w - a, 0], [w - a, c], [w, c], [w, h], [0, h]];
      var s2 = '<polygon points="' + pts.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '" fill="' + RELL[2] + '" stroke="' + C.ink + '" stroke-width="2.5"/>' +
        cota(X(0), Y(h), X(w), Y(h), w + ' cm', 20) + '<text x="' + (X(0) - 6) + '" y="' + (Y(h / 2) + 5) + '" text-anchor="end" font-size="15" font-weight="700" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '">' + h + ' cm</text>' +
        cota(X(0), Y(0), X(w - a), Y(0), (w - a) + ' cm', -6) + '<text x="' + (X(w) + 6) + '" y="' + (Y((c + h) / 2) + 5) + '" font-size="15" font-weight="700" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '">' + (h - c) + ' cm</text>';
      var A2 = w * h - a * c;
      return it('Halla el área de la figura en forma de L (todos los ángulos son rectos).', A2 + ' cm²', 'Completa el rectángulo grande (' + w + ' × ' + h + ' = ' + (w * h) + ') y resta el pedazo que falta (' + a + ' × ' + c + ' = ' + (a * c) + '): ' + A2 + ' cm².', { num: A2, svg: svg(320, Y(h) + 32, s2, 'figura en L', 320) });
    },
    angulo: function (r, g) {
      var m = r.p([25, 35, 40, 50, 60, 70, 80, 90, 90, 100, 115, 120, 135, 150, 165, 180]), cx = 110, cy = 120, R = 90, rad = m * Math.PI / 180;
      var x2 = cx + R * Math.cos(-rad), y2 = cy + R * Math.sin(-rad);
      var s = '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + R) + '" y2="' + cy + '" stroke="' + C.ink + '" stroke-width="3" stroke-linecap="round"/><line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + C.ink + '" stroke-width="3" stroke-linecap="round"/>';
      if (m === 90) s += marcaRecto(cx, cy, 1, -1, 18);
      else s += '<path d="M' + (cx + 30) + ' ' + cy + ' A30 30 0 ' + (m > 180 ? 1 : 0) + ' 0 ' + (cx + 30 * Math.cos(-rad)).toFixed(1) + ' ' + (cy + 30 * Math.sin(-rad)).toFixed(1) + '" fill="none" stroke="' + C.orange + '" stroke-width="3"/>';
      s += '<text x="' + (cx + 44 * Math.cos(-rad / 2)).toFixed(1) + '" y="' + (cy + 44 * Math.sin(-rad / 2) + 5).toFixed(1) + '" font-size="15" font-weight="800" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '">' + m + '°</text>';
      var cls = m < 90 ? 'agudo' : m === 90 ? 'recto' : m < 180 ? 'obtuso' : 'llano';
      return opc('¿Qué tipo de ángulo es?', cls, ['agudo', 'recto', 'obtuso', 'llano'], 'Agudo: menos de 90°. Recto: 90°. Obtuso: entre 90° y 180°. Llano: 180°. Este mide ' + m + '°, es ' + cls + '.', { svg: svg(240, 135, s, 'ángulo de ' + m + ' grados', 240) }, r);
    },
    anguloTri: function (r, g) {
      var a = r.i(30, 80), b = r.i(30, 150 - a - 10), c = 180 - a - b, A = [30, 150], L = 220, ra = a * Math.PI / 180, rb = b * Math.PI / 180;
      var AC = L * Math.sin(rb) / Math.sin(ra + rb), Cx = A[0] + AC * Math.cos(ra), Cy = A[1] - AC * Math.sin(ra);
      var sc = Cy < 15 ? (A[1] - 15) / (A[1] - Cy) : 1; L *= sc; Cx = A[0] + AC * sc * Math.cos(ra); Cy = A[1] - AC * sc * Math.sin(ra);
      var B = [A[0] + L, A[1]];
      var s = '<polygon points="' + A[0] + ',' + A[1] + ' ' + B[0].toFixed(1) + ',' + B[1] + ' ' + Cx.toFixed(1) + ',' + Cy.toFixed(1) + '" fill="' + RELL[3] + '" stroke="' + C.ink + '" stroke-width="2.5"/>' +
        '<text x="' + (A[0] + 26) + '" y="' + (A[1] - 8) + '" font-size="14" font-weight="800" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '">' + a + '°</text>' +
        '<text x="' + (B[0] - 30) + '" y="' + (B[1] - 8) + '" text-anchor="end" font-size="14" font-weight="800" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '">' + b + '°</text>' +
        '<text x="' + Cx.toFixed(1) + '" y="' + (Cy + 26).toFixed(1) + '" text-anchor="middle" font-size="16" font-weight="800" font-family="Public Sans, Arial, sans-serif" fill="' + C.orange + '">?</text>';
      return it('Dos ángulos del triángulo miden ' + a + '° y ' + b + '°. ¿Cuánto mide el tercer ángulo?', c + '°', 'Los ángulos interiores de un triángulo suman 180°: 180° − ' + a + '° − ' + b + '° = ' + c + '°.', { num: c, svg: svg(280, 165, s, 'triángulo', 280) });
    },
    circulo: function (r, g) {
      var rr = r.i(2, 12), useD = r.b(0.4), q = r.b() ? 'longitud de la circunferencia' : 'área del círculo', s = '<circle cx="110" cy="80" r="66" fill="' + RELL[1] + '" stroke="' + C.ink + '" stroke-width="2.5"/><circle cx="110" cy="80" r="3" fill="' + C.ink + '"/>';
      if (useD) s += '<line x1="44" y1="80" x2="176" y2="80" stroke="' + C.red + '" stroke-width="2.5"/>' + cota(44, 80, 176, 80, 'd = ' + (2 * rr) + ' cm', -8);
      else s += '<line x1="110" y1="80" x2="176" y2="80" stroke="' + C.red + '" stroke-width="2.5"/>' + cota(110, 80, 176, 80, 'r = ' + rr + ' cm', -8);
      var v = q.indexOf('longitud') >= 0 ? r2(2 * 3.14 * rr) : r2(3.14 * rr * rr);
      var ex = (useD ? 'El radio es la mitad del diámetro: r = ' + (2 * rr) + ' ÷ 2 = ' + rr + ' cm. ' : '') + (q.indexOf('longitud') >= 0 ? 'L = 2 · π · r = 2 × 3,14 × ' + rr + ' = ' + fmtN(v) + ' cm.' : 'A = π · r² = 3,14 × ' + rr + '² = 3,14 × ' + (rr * rr) + ' = ' + fmtN(v) + ' cm².');
      return it('Usa π ≈ 3,14. Calcula la ' + q + '.', fmtN(v) + (q.indexOf('longitud') >= 0 ? ' cm' : ' cm²'), ex, { num: v, svg: svg(220, 160, s, 'círculo', 220) });
    },
    pitagoras: function (r, g) {
      var tr = r.p([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29]]);
      var a = tr[0], b = tr[1], c = tr[2], sc = Math.min(210 / b, 110 / a), W = b * sc, H = a * sc, x0 = 40, y0 = 20 + (110 - H);
      var ask = r.i(0, 2); // 0 hipotenusa, 1 cateto vertical, 2 cateto horizontal
      var lc = ask === 0 ? '?' : c + ' cm', la = ask === 1 ? '?' : a + ' cm', lb = ask === 2 ? '?' : b + ' cm';
      var s = '<polygon points="' + x0 + ',' + (y0 + H) + ' ' + (x0 + W) + ',' + (y0 + H) + ' ' + x0 + ',' + y0 + '" fill="' + RELL[2] + '" stroke="' + C.ink + '" stroke-width="2.5"/>' + marcaRecto(x0, y0 + H, 1, -1, 14) +
        cota(x0, y0 + H, x0 + W, y0 + H, lb, 22) + '<text x="' + (x0 - 6) + '" y="' + (y0 + H / 2 + 5) + '" text-anchor="end" font-size="15" font-weight="700" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '">' + esc(la) + '</text>' +
        '<text x="' + (x0 + W / 2 + 10) + '" y="' + (y0 + H / 2 - 6) + '" font-size="15" font-weight="700" font-family="Public Sans, Arial, sans-serif" fill="' + C.red + '">' + esc(lc) + '</text>';
      var ans = ask === 0 ? c : ask === 1 ? a : b;
      var ex = ask === 0 ? 'c² = a² + b² = ' + a + '² + ' + b + '² = ' + (a * a) + ' + ' + (b * b) + ' = ' + (c * c) + '; c = √' + (c * c) + ' = ' + c + ' cm.' : 'cateto² = c² − otro² = ' + c + '² − ' + (ask === 1 ? b : a) + '² = ' + (c * c) + ' − ' + (ask === 1 ? b * b : a * a) + ' = ' + (ans * ans) + '; cateto = ' + ans + ' cm.';
      return it('Usa el teorema de Pitágoras. ¿Cuánto mide el lado marcado con «?»', ans + ' cm', ex, { num: ans, svg: svg(320, 175, s, 'triángulo rectángulo', 320) });
    },
    plano: function (r, g, modo) {
      var cs = 17, N = 8, O = 8 + N * cs, s = '';
      for (var i = -N; i <= N; i++) {
        s += '<line x1="' + (O + i * cs) + '" y1="8" x2="' + (O + i * cs) + '" y2="' + (8 + 2 * N * cs) + '" stroke="' + (i === 0 ? C.ink : '#D3DCE8') + '" stroke-width="' + (i === 0 ? 2 : 1) + '"/>';
        s += '<line x1="8" y1="' + (O + i * cs) + '" x2="' + (8 + 2 * N * cs) + '" y2="' + (O + i * cs) + '" stroke="' + (i === 0 ? C.ink : '#D3DCE8') + '" stroke-width="' + (i === 0 ? 2 : 1) + '"/>';
        if (i !== 0 && i % 2 === 0) { s += '<text x="' + (O + i * cs) + '" y="' + (O + 14) + '" font-size="10" text-anchor="middle" font-family="Public Sans, Arial, sans-serif" fill="#556">' + (i < 0 ? MENOS + (-i) : i) + '</text><text x="' + (O - 5) + '" y="' + (O - i * cs + 4) + '" font-size="10" text-anchor="end" font-family="Public Sans, Arial, sans-serif" fill="#556">' + (i < 0 ? MENOS + (-i) : i) + '</text>'; }
      }
      var x1, y1, dx, dy;
      if (modo === 'dist') { var tr = r.p([[3, 4], [4, 3], [6, 8], [8, 6], [5, 0], [0, 7]]); dx = tr[0] * r.s(); dy = tr[1] * r.s(); }
      else if (modo === 'medio') { dx = 2 * r.nz(-4, 4); dy = 2 * r.i(-4, 4); }
      else { dx = r.nz(-7, 7); dy = r.i(-7, 7); }
      x1 = r.i(Math.max(-N, -N - dx), Math.min(N, N - dx)); y1 = r.i(Math.max(-N, -N - dy), Math.min(N, N - dy));
      var x2 = x1 + dx, y2 = y1 + dy, P = function (x, y) { return [O + x * cs, O - y * cs]; }, A = P(x1, y1), B = P(x2, y2);
      s += '<line x1="' + A[0] + '" y1="' + A[1] + '" x2="' + B[0] + '" y2="' + B[1] + '" stroke="' + C.blue + '" stroke-width="3"/>';
      [[A, 'A', x1, y1], [B, 'B', x2, y2]].forEach(function (q) { s += '<circle cx="' + q[0][0] + '" cy="' + q[0][1] + '" r="5" fill="' + C.orange + '" stroke="#222"/><text x="' + (q[0][0] + 7) + '" y="' + (q[0][1] - 7) + '" font-size="13" font-weight="800" font-family="Public Sans, Arial, sans-serif" fill="' + C.navy + '" paint-order="stroke" stroke="#fff" stroke-width="3">' + q[1] + '(' + sg(q[2]) + ', ' + sg(q[3]) + ')</text>'; });
      var fig = svg(2 * N * cs + 16, 2 * N * cs + 16, s, 'plano cartesiano con A y B', 300);
      var pts = 'A(' + sg(x1) + ', ' + sg(y1) + ') y B(' + sg(x2) + ', ' + sg(y2) + ')';
      if (modo === 'dist') { var d = Math.sqrt(dx * dx + dy * dy); return it('Halla la distancia entre ' + pts + '.', fmtN(d) + ' unidades', 'd = √((x₂ − x₁)² + (y₂ − y₁)²) = √(' + par(dx) + '² + ' + par(dy) + '²) = √' + (dx * dx + dy * dy) + ' = ' + fmtN(d) + '.', { num: d, svg: fig }); }
      if (modo === 'medio') { var mx = x1 + dx / 2, my = y1 + dy / 2; return it('Halla el punto medio del segmento entre ' + pts + '. Escribe x y y.', '(' + sg(mx) + ', ' + sg(my) + ')', 'M = ((x₁ + x₂)/2, (y₁ + y₂)/2) = ((' + sg(x1) + ' + ' + par(x2) + ')/2, (' + sg(y1) + ' + ' + par(y2) + ')/2) = (' + sg(mx) + ', ' + sg(my) + ').', { nums: [mx, my], ordenado: true, ayuda: 'Ej.: 3; −1', svg: fig }); }
      var m = F(dy, dx); return it('Halla la pendiente de la recta que pasa por ' + pts + '.', fStr(m), 'm = (y₂ − y₁)/(x₂ − x₁) = ' + par(dy) + '/' + par(dx) + ' = ' + fStr(m) + '.' + (m.n === 0 ? ' La recta es horizontal.' : m.n > 0 ? ' La recta sube de izquierda a derecha.' : ' La recta baja de izquierda a derecha.'), { num: fVal(m), svg: fig });
    }
  };
  var GEO_G = [
    ['nombre', 'contarFig', 'nombre'], ['nombre', 'lados', 'contarFig'], ['lados', 'simetria', 'nombre'], ['perimetro', 'simetria', 'lados'],
    ['perimetro', 'areaCuad', 'simetria'], ['areaRect', 'areaTri', 'areaComp', 'perimetro'], ['angulo', 'anguloTri', 'areaTri', 'areaComp'],
    ['circulo', 'areaComp', 'anguloTri', 'areaTri'], ['pitagoras', 'circulo', 'anguloTri'], ['pitagoras', 'circulo', 'areaComp'],
    ['dist', 'pendiente', 'medio', 'pitagoras'], ['dist', 'pendiente', 'medio']
  ];
  function geoGen(k, r, g) {
    if (k === 'perimetro') return GEO.malla(r, g, 'per');
    if (k === 'areaCuad') return GEO.malla(r, g, 'area');
    if (k === 'dist') return GEO.plano(r, g, 'dist');
    if (k === 'pendiente') return GEO.plano(r, g, 'pend');
    if (k === 'medio') return GEO.plano(r, g, 'medio');
    return GEO[k](r, g);
  }

  /* ------------------------------------------------------------------ *
   * 10. Tipo: DINERO Y CAMBIO
   * ------------------------------------------------------------------ */
  var MONEDAS = [50, 100, 200, 500, 1000], BILLETES = [2000, 5000, 10000, 20000, 50000, 100000];
  var PRODS = [['Pandebono', 12, 25], ['Empanada', 15, 30], ['Bolsa de leche', 40, 60], ['Libra de arroz', 30, 45], ['Panela', 20, 35], ['Huevo', 5, 9], ['Gaseosa', 25, 45], ['Pan aliñado', 3, 12], ['Mango', 10, 25], ['Avena', 20, 38], ['Libra de lentejas', 40, 60], ['Chocolatina', 10, 30], ['Cholado', 50, 90], ['Cuaderno', 30, 80], ['Lápiz', 8, 20]];
  function prods(r, n, mult) { return r.sh(PRODS).slice(0, n).map(function (p) { return [p[0], r.i(p[1], p[2]) * (mult || 100)]; }); }
  function sumLista(l) { return l.reduce(function (a, b) { return a + b; }, 0); }
  function billeteMayor(t, r) { var ok = BILLETES.filter(function (b) { return b > t; }); return ok.length ? r.p(ok.slice(0, 2)) : 100000 * Math.ceil((t + 1) / 100000); }
  var DIN = {
    contarMonedas: function (r, g) { var k = r.i(2, 8), v = r.p([100, 200, 500]); var l = []; for (var i = 0; i < k; i++) l.push(v); return it('¿Cuántas monedas hay?', k, 'Cuenta cada moneda una vez: hay ' + k + ' monedas de ' + fmtM(v) + '.', { num: k, svg: svgDinero(l) }); },
    masDinero0: function (r, g) { var a = r.i(1, 5), b; do { b = r.i(1, 5); } while (b === a); var la = [], lb = [], i; for (i = 0; i < a; i++) la.push(100); for (i = 0; i < b; i++) lb.push(100); return opc('Todas las monedas son de $100. ¿Quién tiene más dinero, Ana o Beto?', a > b ? 'Ana' : 'Beto', ['Ana', 'Beto'], 'Ana tiene ' + a + ' monedas y Beto ' + b + '. Como todas valen lo mismo, tiene más quien tiene más monedas: ' + (a > b ? 'Ana' : 'Beto') + '.', { svg: '<div class="sf-dos"><div><b>Ana</b>' + svgDinero(la, 300) + '</div><div><b>Beto</b>' + svgDinero(lb, 300) + '</div></div>' }, r); },
    contarDinero: function (r, g) {
      var pool = g <= 1 ? [50, 100, 200, 500] : g === 2 ? [100, 200, 500, 1000, 2000, 5000] : [500, 1000, 2000, 5000, 10000, 20000];
      var n = r.i(3, g <= 1 ? 5 : 6), l = []; for (var i = 0; i < n; i++) l.push(r.p(pool));
      var t = sumLista(l); if (g <= 1 && t > 1000) { l = [100, 200, 500].slice(0, 3); t = 800; }
      return moneyIt('¿Cuánto dinero hay en total?', t, 'Empieza por los billetes o monedas de mayor valor y ve sumando: ' + l.slice().sort(function (a, b) { return b - a; }).map(fmtM).join(' + ') + ' = ' + fmtM(t) + '.', { svg: svgDinero(l) });
    },
    masDinero: function (r, g) {
      var pool = g <= 1 ? [50, 100, 200, 500] : [200, 500, 1000, 2000, 5000];
      var la, lb, ta, tb, i;
      do { la = []; lb = []; for (i = 0; i < r.i(2, 4); i++) la.push(r.p(pool)); for (i = 0; i < r.i(2, 4); i++) lb.push(r.p(pool)); ta = sumLista(la); tb = sumLista(lb); } while (ta === tb);
      return opc('¿Quién tiene más dinero, Ana o Beto?', ta > tb ? 'Ana' : 'Beto', ['Ana', 'Beto'], 'Ana tiene ' + fmtM(ta) + ' y Beto ' + fmtM(tb) + '. No gana quien tiene más monedas, sino quien suma más valor.', { svg: '<div class="sf-dos"><div><b>Ana</b>' + svgDinero(la, 300) + '</div><div><b>Beto</b>' + svgDinero(lb, 300) + '</div></div>' }, r);
    },
    total: function (r, g) { var n = r.i(2, 3), p = prods(r, n, g <= 3 ? 100 : 100), t = sumLista(p.map(function (x) { return x[1]; })); return moneyIt('Mira la lista de precios. ¿Cuánto cuesta comprar un(a) ' + p.map(function (x) { return x[0].toLowerCase(); }).join(', un(a) ') + '?', t, p.map(function (x) { return fmtM(x[1]); }).join(' + ') + ' = ' + fmtM(t) + '.', { svg: svgTablero(p) }); },
    vuelto: function (r, g) { var n = r.i(1, 3), p = prods(r, n), t = sumLista(p.map(function (x) { return x[1]; })), b = billeteMayor(t, r); return moneyIt('En la Tienda de Don Chucho compras: ' + p.map(function (x) { return x[0].toLowerCase(); }).join(', ') + '. Pagas con el billete de abajo. ¿Cuánto te deben devolver (vuelto)?', b - t, 'Total: ' + fmtM(t) + '. Vuelto = lo que pagas − lo que cuesta = ' + fmtM(b) + ' − ' + fmtM(t) + ' = ' + fmtM(b - t) + '.', { svg: svgTablero(p) + svgDinero([b], 140) }); },
    cantidades: function (r, g) { var p = prods(r, 2), q = [r.i(2, 6), r.i(2, 9)], t = p[0][1] * q[0] + p[1][1] * q[1], b = billeteMayor(t, r); return moneyIt('Compras ' + q[0] + ' × ' + p[0][0].toLowerCase() + ' y ' + q[1] + ' × ' + p[1][0].toLowerCase() + ' y pagas con un billete de ' + fmtM(b) + '. ¿Cuánto es el vuelto?', b - t, q[0] + ' × ' + fmtM(p[0][1]) + ' + ' + q[1] + ' × ' + fmtM(p[1][1]) + ' = ' + fmtM(t) + '. Vuelto: ' + fmtM(b) + ' − ' + fmtM(t) + ' = ' + fmtM(b - t) + '.', { svg: svgTablero(p) }); },
    billetes: function (r, g) { var b = r.p([2000, 5000, 10000, 20000]), k = r.i(2, 9), m = b * k; return it('¿Cuántos billetes de ' + fmtM(b) + ' necesitas para completar ' + fmtM(m) + '?', k, fmtM(m) + ' ÷ ' + fmtM(b) + ' = ' + k + ' billetes.', { num: k, svg: svgDinero([b], 140) }); },
    descuento: function (r, g) { var p = r.i(20, 300) * 1000, d = r.p([10, 15, 20, 25, 30, 40, 50]); var f = p * (100 - d) / 100; return moneyIt('En la Tienda de Don Chucho unos tenis cuestan ' + fmtM(p) + ' y tienen ' + d + ' % de descuento. ¿Cuánto se paga?', f, 'Descuento: ' + d + ' % de ' + fmtM(p) + ' = ' + fmtM(p * d / 100) + '. Precio final: ' + fmtM(p) + ' − ' + fmtM(p * d / 100) + ' = ' + fmtM(f) + '.'); },
    iva: function (r, g) { var p = r.i(10, 500) * 1000; var iv = p * 19 / 100; return moneyIt('Una licuadora cuesta ' + fmtM(p) + ' antes de IVA. ¿Cuánto cuesta con el IVA del 19 %?', p + iv, 'IVA: 19 % de ' + fmtM(p) + ' = ' + fmtM(iv) + '. Total: ' + fmtM(p) + ' + ' + fmtM(iv) + ' = ' + fmtM(p + iv) + ' (o ' + fmtM(p) + ' × 1,19).'); },
    ivaBase: function (r, g) { var p = r.i(10, 400) * 1000; var t = p * 119 / 100; return moneyIt('Una factura dice: total con IVA (19 %) = ' + fmtM(t) + '. ¿Cuál era el precio antes de IVA?', p, 'El total es el 119 % del precio base: ' + fmtM(t) + ' ÷ 1,19 = ' + fmtM(p) + '. (Ojo: no basta restar el 19 % del total.)'); },
    presupuesto: function (r, g) { var ing = r.i(15, 60) * 100000, pa = r.p([30, 35, 40]), pc = r.p([20, 25]), pt = r.p([10, 15]); var rest = ing * (100 - pa - pc - pt) / 100; return moneyIt('Una familia de Cali tiene un ingreso mensual de ' + fmtM(ing) + '. Gasta ' + pa + ' % en arriendo, ' + pc + ' % en mercado y ' + pt + ' % en transporte. ¿Cuánto dinero le queda?', rest, 'Gastos: ' + (pa + pc + pt) + ' %. Queda el ' + (100 - pa - pc - pt) + ' %: ' + fmtM(ing) + ' × ' + (100 - pa - pc - pt) + ' ÷ 100 = ' + fmtM(rest) + '.'); },
    interes: function (r, g) { var Cc = r.i(5, 50) * 100000, i = r.p([3, 4, 5, 6, 8, 10, 12]), t = r.i(1, 5); var I = Cc * i * t / 100; var monto = r.b(); return moneyIt('Inviertes ' + fmtM(Cc) + ' a un interés simple del ' + i + ' % anual durante ' + t + ' año' + (t > 1 ? 's' : '') + '. ' + (monto ? '¿Cuánto dinero tendrás al final (capital + interés)?' : '¿Cuánto interés ganas?'), monto ? Cc + I : I, 'I = C · i · t = ' + fmtM(Cc) + ' × ' + i + '/100 × ' + t + ' = ' + fmtM(I) + '.' + (monto ? ' Monto = ' + fmtM(Cc) + ' + ' + fmtM(I) + ' = ' + fmtM(Cc + I) + '.' : '')); },
    descSuc: function (r, g) { var p = r.i(10, 80) * 10000, d1 = r.p([10, 20, 30]), d2 = r.p([10, 20, 25, 50]); var f = p * (100 - d1) / 100 * (100 - d2) / 100; return moneyIt('Un celular cuesta ' + fmtM(p) + '. Tiene un descuento del ' + d1 + ' % y, sobre ese nuevo precio, otro del ' + d2 + ' %. ¿Cuál es el precio final?', f, 'Primero: ' + fmtM(p) + ' × ' + (100 - d1) + ' % = ' + fmtM(p * (100 - d1) / 100) + '. Luego × ' + (100 - d2) + ' % = ' + fmtM(f) + '. ¡No es lo mismo que ' + (d1 + d2) + ' % de una vez!'); }
  };
  var DIN_G = [
    ['contarMonedas', 'masDinero0', 'contarMonedas'], ['contarDinero', 'masDinero', 'contarMonedas'], ['contarDinero', 'masDinero', 'total'],
    ['total', 'vuelto', 'contarDinero'], ['total', 'vuelto', 'billetes', 'contarDinero'], ['cantidades', 'vuelto', 'billetes', 'total'],
    ['cantidades', 'vuelto', 'descuento'], ['descuento', 'iva', 'cantidades'], ['iva', 'descuento', 'presupuesto', 'ivaBase'],
    ['presupuesto', 'interes', 'ivaBase', 'iva'], ['interes', 'descSuc', 'ivaBase', 'presupuesto'], ['interes', 'descSuc', 'ivaBase', 'presupuesto']
  ];

  /* ------------------------------------------------------------------ *
   * 11. Tipo: ENCUENTRA EL ERROR
   * ------------------------------------------------------------------ */
  function errIt(nombre, pasos, conError, correcto, tipoErr, extra, pista) {
    var html = '<span class="sf-quien">Así lo resolvió ' + esc(nombre) + ':</span><ol class="sf-pasos">' + pasos.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ol>';
    var e = extra || {}; e.modo = 'error'; e.veredicto = conError ? 'error' : 'correcto'; e.resultado = correcto;
    return it(html, (conError ? 'Tiene un error' : 'Correcto') + ' · resultado correcto: ' + correcto,
      conError ? 'Error: ' + tipoErr + '. ' + (pista || '') + ' El resultado correcto es ' + correcto + '.' : 'El procedimiento es correcto: ' + correcto + '. (Un error típico aquí sería: ' + tipoErr.toLowerCase() + '.)', e);
  }
  var ERR = {
    contar: function (r, g, nm, e) { var k = r.i(3, 10), dicho = e ? k + r.p([-1, 1]) : k; if (dicho < 1) dicho = k + 1; var o = r.p(OBJK); return errIt(nm, ['Conté los ' + OBJ[o].p + ' y dije: «Hay <b>' + dicho + '</b>».'], e, String(k), 'contar dos veces un objeto o saltarse uno', { num: k, svg: svgContar(o, k) }, 'Toca cada objeto una sola vez.'); },
    sumaLleva: function (r, g, nm, e) {
      var a, b; do { a = r.i(g >= 2 ? 120 : 15, g >= 2 ? 589 : 69); b = r.i(g >= 2 ? 105 : 12, g >= 2 ? 399 : 29); } while ((a % 10) + (b % 10) < 10 || a + b > 999);
      var u = (a % 10) + (b % 10), res = a + b, mal = res - 10;
      var pasos = ['Unidades: ' + (a % 10) + ' + ' + (b % 10) + ' = ' + u + (e ? ', escribo ' + (u % 10) + '.' : ', escribo ' + (u % 10) + ' y llevo 1.'), 'Decenas' + (g >= 2 ? ' y centenas' : '') + ': ' + (e ? 'sumo sin lo que llevaba.' : 'sumo y agrego el 1 que llevaba.'), a + ' + ' + b + ' = <b>' + (e ? mal : res) + '</b>'];
      return errIt(nm, pasos, e, String(res), 'olvidar lo que se lleva (reagrupación)', { num: res }, 'Cuando las unidades suman 10 o más, se lleva 1 a las decenas.');
    },
    restaPresta: function (r, g, nm, e) {
      var a, b; do { a = r.i(g >= 2 ? 300 : 30, g >= 2 ? 999 : 99); b = r.i(g >= 2 ? 101 : 11, a - 10); } while ((a % 10) >= (b % 10));
      var res = a - b, ua = a % 10, ub = b % 10;
      var mal = (Math.floor(a / 10) - Math.floor(b / 10)) * 10 + (ub - ua);
      var pasos = e ? ['Unidades: como ' + ua + ' es menor que ' + ub + ', hago ' + ub + ' − ' + ua + ' = ' + (ub - ua) + '.', 'Resto las demás cifras sin prestar.', a + ' − ' + b + ' = <b>' + mal + '</b>'] : ['Unidades: ' + ua + ' es menor que ' + ub + ', presto 1 decena: ' + (ua + 10) + ' − ' + ub + ' = ' + (ua + 10 - ub) + '.', 'A la cifra de las decenas le quito el 1 que presté y sigo restando.', a + ' − ' + b + ' = <b>' + res + '</b>'];
      return errIt(nm, pasos, e, String(res), 'restar la cifra menor de la mayor en vez de prestar', { num: res }, 'Si la cifra de arriba es menor, se presta una decena.');
    },
    tabla: function (r, g, nm, e) { var a = r.i(6, 9), b = r.i(6, 9), p = a * b, mal = p + r.p([-a, a, -1, 1, b]); return errIt(nm, [a + ' × ' + b + ' = <b>' + (e ? mal : p) + '</b>'], e, String(p), 'confundir un resultado de la tabla', { num: p }, 'Repasa la tabla del ' + a + ': ' + a + ' × ' + b + ' = ' + p + '.'); },
    multLleva: function (r, g, nm, e) { var a, b; do { a = r.i(23, 98); b = r.i(3, 9); } while ((a % 10) * b < 10); var p = a * b, u = (a % 10) * b, lleva = Math.floor(u / 10), mal = p - lleva * 10; return errIt(nm, [(a % 10) + ' × ' + b + ' = ' + u + (e ? ', escribo ' + (u % 10) + '.' : ', escribo ' + (u % 10) + ' y llevo ' + lleva + '.'), Math.floor(a / 10) + ' × ' + b + ' = ' + (Math.floor(a / 10) * b) + (e ? '.' : ', más ' + lleva + ' = ' + (Math.floor(a / 10) * b + lleva) + '.'), a + ' × ' + b + ' = <b>' + (e ? mal : p) + '</b>'], e, String(p), 'olvidar sumar lo que se lleva en la multiplicación', { num: p }); },
    fracDen: function (r, g, nm, e) { var a = F(r.i(1, 4), r.i(2, 6)), b = F(r.i(1, 4), r.i(3, 7)); if (a.n >= a.d) a = F(1, a.d); if (b.n >= b.d) b = F(1, b.d); var s = fAdd(a, b), m = lcm(a.d, b.d); var malF = F(a.n + b.n, a.d + b.d); var pasos = e ? ['Sumo numeradores: ' + a.n + ' + ' + b.n + ' = ' + (a.n + b.n) + '.', 'Sumo denominadores: ' + a.d + ' + ' + b.d + ' = ' + (a.d + b.d) + '.', fH(a) + ' + ' + fH(b) + ' = <b>' + frH(a.n + b.n, a.d + b.d) + '</b>'] : ['Denominador común: ' + m + '.', fH(a) + ' + ' + fH(b) + ' = ' + frH(a.n * m / a.d, m) + ' + ' + frH(b.n * m / b.d, m) + '.', 'Resultado: <b>' + fH(s) + '</b>']; return errIt(nm, pasos, e, fStr(s), 'sumar los denominadores', { num: fVal(s) }, 'Las fracciones se suman con denominador común; los denominadores no se suman.'); },
    decimalComa: function (r, g, nm, e) { var a = r.i(11, 99) / 10, b = r.i(11, 99) / 100; var res = r2(a + b), mal = (Math.round(a * 10) + Math.round(b * 100)) / 100; return errIt(nm, e ? ['Pongo los números uno debajo del otro alineados a la derecha.', fmtN(a) + ' + ' + fmtN(b) + ' = <b>' + fmtN(mal) + '</b>'] : ['Alineo las comas: ' + fmtN(a) + '0 + ' + fmtN(b) + '.', fmtN(a) + ' + ' + fmtN(b) + ' = <b>' + fmtN(res) + '</b>'], e, fmtN(res), 'no alinear la coma decimal', { num: res }, 'Siempre se alinean las comas (décimas con décimas).'); },
    jerarquia: function (r, g, nm, e) { var a = r.i(2, 9), b = r.i(2, 9), c = r.i(2, 9); var res = a + b * c, mal = (a + b) * c; return errIt(nm, e ? [a + ' + ' + b + ' = ' + (a + b) + '.', (a + b) + ' × ' + c + ' = ' + mal + '.', a + ' + ' + b + ' × ' + c + ' = <b>' + mal + '</b>'] : [b + ' × ' + c + ' = ' + (b * c) + '.', a + ' + ' + (b * c) + ' = ' + res + '.', a + ' + ' + b + ' × ' + c + ' = <b>' + res + '</b>'], e, String(res), 'no respetar la jerarquía de operaciones', { num: res }, 'La multiplicación va antes que la suma.'); },
    potencia: function (r, g, nm, e) { var b = r.i(2, 6), n = r.i(2, 4), res = Math.pow(b, n); return errIt(nm, e ? [b + '<sup>' + n + '</sup> = ' + b + ' × ' + n + ' = <b>' + (b * n) + '</b>'] : [b + '<sup>' + n + '</sup> = ' + Array(n + 1).join(b + ' × ').slice(0, -3) + ' = <b>' + res + '</b>'], e && b * n !== res, String(res), 'multiplicar la base por el exponente', { num: res }, 'El exponente indica cuántas veces se multiplica la base por sí misma.'); },
    signos: function (r, g, nm, e) { var a = r.i(2, 15), b = r.i(2, 15); var res = -a + b, mal = -a - b; return errIt(nm, e ? [MENOS + a + ' − (' + MENOS + b + ') = ' + MENOS + a + ' − ' + b + '.', 'Resultado: <b>' + sg(mal) + '</b>'] : [MENOS + a + ' − (' + MENOS + b + ') = ' + MENOS + a + ' + ' + b + '.', 'Resultado: <b>' + sg(res) + '</b>'], e, sg(res), 'error de signos al restar un negativo', { num: res }, 'Restar un número negativo es sumar su opuesto: − (−' + b + ') = +' + b + '.'); },
    signosMult: function (r, g, nm, e) { var a = r.i(2, 12), b = r.i(2, 9); var res = a * b; return errIt(nm, ['(' + MENOS + a + ') × (' + MENOS + b + ') = <b>' + (e ? sg(-res) : sg(res)) + '</b>'], e, sg(res), 'ley de signos (menos por menos es más)', { num: res }); },
    porcentaje: function (r, g, nm, e) { var p = r.p([10, 20, 25, 50]), n = r.i(2, 20) * 20; var res = n * p / 100, mal = n / p; return errIt(nm, e ? ['El ' + p + ' % de ' + n + ' es ' + n + ' ÷ ' + p + ' = <b>' + fmtN(mal) + '</b>'] : ['El ' + p + ' % de ' + n + ' es ' + n + ' × ' + p + ' ÷ 100 = <b>' + fmtN(res) + '</b>'], e && mal !== res, fmtN(res), 'dividir entre el porcentaje en vez de multiplicar y dividir entre 100', { num: res }); },
    cuadradoBinomio: function (r, g, nm, e) { var b = r.nz(-6, 6), p = {}; p[2] = 1; p[1] = 2 * b; p[0] = b * b; var mal = {}; mal[2] = 1; mal[0] = b * b; return errIt(nm, ['(x ' + (b < 0 ? MENOS : '+') + ' ' + Math.abs(b) + ')<sup>2</sup> = <b>' + polyTxt(e ? mal : p, 'x', true) + '</b>'], e, polyTxt(p, 'x'), 'olvidar el doble producto: (a + b)² ≠ a² + b²', { poly: p, ayuda: 'Ej.: x^2 + 6x + 9' }, '(a + b)² = a² + 2ab + b².'); },
    expProd: function (r, g, nm, e) { var b = r.i(2, 3), m = r.i(2, 3), n = r.i(2, 3); var res = Math.pow(b, m + n), mal = Math.pow(b, m * n); return errIt(nm, [b + '<sup>' + m + '</sup> · ' + b + '<sup>' + n + '</sup> = ' + b + '<sup>' + (e ? m * n : m + n) + '</sup>', '= <b>' + (e ? mal : res) + '</b>'], e && mal !== res, String(res), 'multiplicar los exponentes en vez de sumarlos', { num: res }, 'En un producto de potencias de igual base, los exponentes se suman.'); },
    ecuacion: function (r, g, nm, e) { var a = r.i(2, 9), x = r.i(-8, 9), b = r.nz(-15, 15), c = a * x + b; var malF = F(c + b, a); return errIt(nm, [a + 'x ' + (b < 0 ? MENOS : '+') + ' ' + Math.abs(b) + ' = ' + sg(c), a + 'x = ' + sg(c) + (e ? (b < 0 ? ' − ' : ' + ') : (b < 0 ? ' + ' : ' − ')) + Math.abs(b) + ' = ' + (e ? sg(c + b) : sg(c - b)), 'x = <b>' + (e ? fH(malF) : sg(x)) + '</b>'], e, 'x = ' + sg(x), 'no cambiar el signo al pasar un término al otro lado', { num: x }, 'Lo que suma pasa a restar y lo que resta pasa a sumar.'); },
    distrib: function (r, g, nm, e) { var a = r.i(2, 6), b = r.i(1, 9), x = r.i(1, 9), c = a * (x + b); var malF = F(c - b, a); return errIt(nm, [a + '(x + ' + b + ') = ' + c, a + 'x + ' + (e ? b : a * b) + ' = ' + c, a + 'x = ' + (e ? c - b : c - a * b), 'x = <b>' + (e ? fH(malF) : x) + '</b>'], e, 'x = ' + x, 'aplicar mal la propiedad distributiva', { num: x }, a + '(x + ' + b + ') = ' + a + 'x + ' + (a * b) + ': el ' + a + ' multiplica a los dos términos.'); },
    factor: function (r, g, nm, e) { var p, q; do { p = r.nz(-8, 8); q = r.nz(-8, 8); } while (p === q || p === -q); var P = {}; P[2] = 1; P[1] = -(p + q); P[0] = p * q; var raiz = e ? [-p, -q] : [p, q]; return errIt(nm, [polyTxt(P, 'x', true) + ' = 0', '(x ' + (p < 0 ? '+ ' + (-p) : MENOS + ' ' + p) + ')(x ' + (q < 0 ? '+ ' + (-q) : MENOS + ' ' + q) + ') = 0', 'x = <b>' + sg(raiz[0]) + '</b>  o  x = <b>' + sg(raiz[1]) + '</b>'], e, 'x = ' + sg(Math.min(p, q)) + ' y x = ' + sg(Math.max(p, q)), 'cambiar el signo de las raíces al igualar cada factor a cero', { nums: [p, q], ayuda: 'Ej.: 2 y −5' }, 'Si (x − a) = 0 entonces x = a, con el signo contrario al del factor.'); },
    trig: function (r, g, nm, e) { var t = r.p([['sen 30°', '1/2', 0.5, '√3/2'], ['cos 60°', '1/2', 0.5, '√3/2'], ['sen 60°', '√3/2', Math.sqrt(3) / 2, '1/2'], ['tan 45°', '1', 1, '√2/2'], ['cos 30°', '√3/2', Math.sqrt(3) / 2, '1/2']]); return errIt(nm, [t[0] + ' = <b>' + (e ? t[3] : t[1]) + '</b>'], e, t[1], 'confundir seno y coseno de los ángulos notables', { num: t[2] }); },
    derivada: function (r, g, nm, e) { var P = {}; P[3] = r.nz(-5, 5); P[2] = r.nz(-6, 6); P[1] = r.nz(-9, 9); var D = polyDer(P), mal = {}; mal[2] = P[3]; mal[1] = P[2]; mal[0] = P[1]; return errIt(nm, ['f(x) = ' + polyTxt(P, 'x', true), 'f′(x) = <b>' + polyTxt(e ? mal : D, 'x', true) + '</b>'], e, polyTxt(D, 'x'), 'bajar el exponente sin multiplicarlo por el coeficiente', { poly: D, ayuda: 'Ej.: 6x^2 - 4x + 1' }, '(a·xⁿ)′ = a·n·xⁿ⁻¹.'); },
    logSuma: function (r, g, nm, e) { var m = r.i(1, 4), n = r.i(1, 4); var res = m + n; return errIt(nm, e ? ['log₂ ' + Math.pow(2, m) + ' + log₂ ' + Math.pow(2, n) + ' = log₂ (' + Math.pow(2, m) + ' + ' + Math.pow(2, n) + ')', '= log₂ ' + (Math.pow(2, m) + Math.pow(2, n)) + ' ≈ <b>' + fmtN(Math.log(Math.pow(2, m) + Math.pow(2, n)) / Math.LN2, 2) + '</b>'] : ['log₂ ' + Math.pow(2, m) + ' + log₂ ' + Math.pow(2, n) + ' = log₂ (' + Math.pow(2, m) + ' · ' + Math.pow(2, n) + ')', '= log₂ ' + Math.pow(2, m + n) + ' = <b>' + res + '</b>'], e, String(res), 'creer que log(a) + log(b) = log(a + b)', { num: res }, 'La propiedad correcta es log(a) + log(b) = log(a · b).'); }
  };
  var ERR_G = [
    ['contar'], ['sumaLleva', 'restaPresta'], ['sumaLleva', 'restaPresta'], ['tabla', 'restaPresta', 'sumaLleva'], ['multLleva', 'tabla', 'restaPresta'],
    ['fracDen', 'decimalComa', 'multLleva'], ['jerarquia', 'potencia', 'fracDen', 'decimalComa'], ['signos', 'signosMult', 'porcentaje', 'jerarquia'],
    ['cuadradoBinomio', 'expProd', 'signos', 'potencia'], ['ecuacion', 'distrib', 'cuadradoBinomio'], ['factor', 'trig', 'ecuacion', 'distrib'], ['derivada', 'logSuma', 'factor', 'trig']
  ];

  /* ------------------------------------------------------------------ *
   * 12. Ideas clave e instrucciones
   * ------------------------------------------------------------------ */
  var IDEAS = {
    calculo: [
      ['Contar es decir un número por cada objeto', 'Toca cada objeto una sola vez mientras dices los números en orden. El último número que dices es la cantidad.', 'Tres mangos: uno, dos, tres. Hay 3. Si junto 2 y 1 más, cuento 1, 2, 3: hay 3.'],
      ['Sumar es juntar; restar es quitar', 'Suma unidades con unidades y decenas con decenas. Para comprobar una resta, suma el resultado con lo que quitaste.', '34 + 25: unidades 4 + 5 = 9, decenas 3 + 2 = 5, resultado 59. Comprobación de 59 − 25 = 34: 34 + 25 = 59.'],
      ['Cuando pasas de 9, llevas', 'Diez unidades forman una decena y diez decenas forman una centena. Multiplicar es una forma rápida de sumar el mismo número varias veces.', '478 + 365: 8 + 5 = 13, escribo 3 y llevo 1; 7 + 6 + 1 = 14, escribo 4 y llevo 1; 4 + 3 + 1 = 8. Resultado 843. Además, 4 + 4 + 4 = 3 × 4 = 12.'],
      ['Multiplicar y dividir son operaciones inversas', 'Si sabes la tabla, sabes dividir: la división pregunta qué número multiplicado por el divisor da el dividendo.', '6 × 7 = 42, por eso 42 ÷ 7 = 6 y 42 ÷ 6 = 7.'],
      ['Dividir es repartir en partes iguales', 'Lo que no alcanza a repartirse es el residuo, y siempre es menor que el divisor. Una fracción equivalente se obtiene multiplicando arriba y abajo por el mismo número.', '47 ÷ 5 = 9 y sobran 2, porque 9 × 5 + 2 = 47. También 2/3 = 8/12 (multiplico por 4 arriba y abajo).'],
      ['Para sumar fracciones necesitas el mismo denominador', 'Si los denominadores son distintos, busca un múltiplo común. Con decimales, alinea siempre la coma.', '1/2 + 1/3 = 3/6 + 2/6 = 5/6. Y 2,5 + 0,35 = 2,50 + 0,35 = 2,85.'],
      ['El orden de las operaciones importa', 'Primero paréntesis, luego potencias, después multiplicaciones y divisiones (de izquierda a derecha) y al final sumas y restas.', '3 + 4 × 2 = 3 + 8 = 11 (no 14). 2⁵ = 2 · 2 · 2 · 2 · 2 = 32.'],
      ['Los enteros tienen dirección; el porcentaje es una parte de 100', 'Signos iguales al multiplicar dan positivo; distintos, negativo. Restar un número es sumar su opuesto.', '(−7) + 12 = 5; (−3) × (−4) = 12; 25 % de 80 = 80 × 25 ÷ 100 = 20.'],
      ['Evaluar es reemplazar la letra por su valor', 'Pon siempre el valor entre paréntesis, sobre todo si es negativo. La raíz cuadrada pregunta qué número al cuadrado da el que está adentro.', 'Si x = −2: 3x² − x = 3(−2)² − (−2) = 12 + 2 = 14. √144 = 12 porque 12² = 144.'],
      ['Una ecuación es una balanza', 'Lo que haces a un lado lo haces al otro para dejar la x sola. Siempre comprueba sustituyendo.', '3x + 5 = 20 → 3x = 15 → x = 5. Comprobación: 3 · 5 + 5 = 20.'],
      ['Si un producto es cero, uno de sus factores es cero', 'Factoriza la ecuación cuadrática y iguala cada factor a cero. Los ángulos de 30°, 45° y 60° tienen razones trigonométricas exactas.', 'x² − 5x + 6 = (x − 2)(x − 3) = 0, entonces x = 2 o x = 3. sen 30° = 1/2, tan 45° = 1.'],
      ['La derivada mide qué tan rápido cambia una función', 'Regla de la potencia: (a·xⁿ)′ = a·n·xⁿ⁻¹. El logaritmo es el exponente que hay que poner a la base.', 'Si f(x) = 3x⁴ − 2x, f′(x) = 12x³ − 2. log₂ 32 = 5 porque 2⁵ = 32.']
    ],
    problemas: [
      ['Primero entiende qué pasa', 'Lee despacio o escucha la historia. Pregúntate: ¿juntamos, quitamos o repartimos? Puedes dibujar.', 'Hay 3 mangos y me regalan 2: juntamos. 3 + 2 = 5 mangos.'],
      ['Lee, piensa, resuelve y comprueba', 'Busca los números y la pregunta. Las palabras «más», «se suben», «en total» indican sumar; «quedan», «se bajan», «se comen» indican restar.', 'Van 23 en el MIO y se suben 14: 23 + 14 = 37 pasajeros.'],
      ['Subraya los datos y la pregunta', 'Antes de calcular, di en voz alta qué te piden. Escribe la respuesta con su unidad (pesos, metros, pasajeros).', '4 filas de 6 mangos: 4 × 6 = 24 mangos.'],
      ['Planea antes de calcular (método de Pólya)', '1. Comprende. 2. Elige la operación. 3. Resuelve. 4. Revisa si el resultado tiene sentido.', '6 empanadas de $1.200: 6 × $1.200 = $7.200. ¿Tiene sentido? Sí, es un poco más de 6 × $1.000.'],
      ['Planea antes de calcular (método de Pólya)', 'Los problemas de varios pasos se resuelven por partes: primero lo que pasa antes, luego lo que pasa después.', 'Sale con 60, se bajan 18 y se suben 25: 60 − 18 = 42; 42 + 25 = 67 pasajeros.'],
      ['Las fracciones y los decimales también cuentan historias', '«Los 3/4 de 40» significa dividir 40 en 4 partes iguales y tomar 3. Revisa que la unidad de la respuesta tenga sentido.', '3/4 de 40 pandebonos = 40 ÷ 4 × 3 = 30 pandebonos.'],
      ['Modela con proporciones y porcentajes', 'Cuando una cantidad crece al mismo ritmo que otra, es proporcional. El porcentaje compara con 100.', 'El 25 % de 80 pasajeros = 80 × 25 ÷ 100 = 20 pasajeros.'],
      ['Modela con proporciones y porcentajes', 'Velocidad = distancia ÷ tiempo. Escribe siempre las unidades: km, h, km/h.', 'A 18 km/h, 27 km se recorren en 27 ÷ 18 = 1,5 h.'],
      ['Traduce la historia a matemáticas', 'Identifica la incógnita, escribe la relación (fórmula o ecuación) y verifica con los datos.', 'Ganar el 20 % sobre $5.000: 5.000 × 1,20 = $6.000.'],
      ['Traduce la historia a matemáticas', 'Muchas situaciones reales se modelan con fórmulas conocidas: área, Pitágoras, interés, velocidad.', 'Diagonal de una cancha de 40 m × 30 m: √(40² + 30²) = 50 m.'],
      ['Modela, calcula e interpreta', 'Un buen resultado se interpreta: ¿es razonable?, ¿cuántas cifras tiene sentido dar?, ¿responde la pregunta?', 'Interés simple: $1.000.000 al 5 % anual por 3 años: I = 1.000.000 × 0,05 × 3 = $150.000.'],
      ['Modela, calcula e interpreta', 'Antes de resolver, estima. Si tu resultado se aleja mucho de la estimación, revisa el modelo.', 'Recorrer 9 km a 18 km/h tarda 0,5 h = 30 minutos (estimación: menos de una hora).']
    ],
    series: [
      ['Un patrón es algo que se repite', 'Mira qué figura viene después de cuál. Di el patrón en voz alta: «círculo, cuadrado, círculo, cuadrado…».', 'círculo, cuadrado, círculo, cuadrado → sigue el círculo.'],
      ['Un patrón es algo que se repite', 'En las figuras busca el grupo que se repite; en los números, cuánto aumenta cada vez.', '2, 4, 6, 8 → aumenta de 2 en 2 → sigue 10.'],
      ['Busca qué cambia de un número al siguiente', 'Resta dos números seguidos para descubrir la regla. La regla debe funcionar para todos.', '15, 20, 25, 30 → +5 → sigue 35.'],
      ['Las reglas pueden sumar, restar o multiplicar', 'Si la diferencia no es igual, prueba si cada número es el anterior multiplicado por algo.', '3, 6, 12, 24 → × 2 → sigue 48.'],
      ['Algunas reglas alternan', 'A veces la regla tiene dos pasos que se turnan, o las diferencias van creciendo.', '10, 15, 13, 18, 16 → +5, −2, +5, −2 → sigue 21.'],
      ['Mira las diferencias entre términos', 'Si las diferencias crecen 1, 3, 5, 7… puede tratarse de cuadrados perfectos.', '1, 4, 9, 16, 25 → son 1², 2², 3², 4², 5² → sigue 36.'],
      ['Mira las diferencias entre términos', 'Los números triangulares suman 2, 3, 4… y las series decimales avanzan con la misma regla que las enteras.', '1, 3, 6, 10 → +2, +3, +4 → sigue 15.'],
      ['Las series también pueden tener negativos', 'Si se multiplica por un número negativo, el signo alterna.', '1, −2, 4, −8 → × (−2) → sigue 16.'],
      ['Término general de una sucesión aritmética', 'aₙ = a₁ + (n − 1)·d, donde d es la diferencia constante.', '5, 8, 11, … → a₁ = 5, d = 3 → aₙ = 5 + (n − 1)·3 = 3n + 2.'],
      ['Término general de una sucesión aritmética', 'Con la fórmula puedes calcular cualquier término sin escribirlos todos.', '5, 8, 11, … el término 20 es 3·20 + 2 = 62.'],
      ['Sucesiones geométricas y sumas', 'Geométrica: aₙ = a₁·rⁿ⁻¹. Suma aritmética: Sₙ = n(a₁ + aₙ)/2.', '3, 6, 12, … → a₈ = 3·2⁷ = 384. 1 + 2 + … + 100 = 100·101/2 = 5.050.'],
      ['Sucesiones geométricas y sumas', 'La razón r = aₙ₊₁ ÷ aₙ. Las sucesiones modelan crecimiento de poblaciones, ahorros e interés compuesto.', '64, 32, 16, … → r = 1/2.']
    ],
    geometria: [
      ['Las figuras tienen nombre y forma', 'El círculo es redondo; el triángulo tiene 3 lados; el cuadrado 4 lados iguales; el rectángulo 4 lados, dos largos y dos cortos.', 'Una ventana suele ser un rectángulo; una pizza, un círculo.'],
      ['Lados y vértices', 'Los lados son las líneas rectas; los vértices son las esquinas donde se unen. Un polígono tiene tantos lados como vértices.', 'El pentágono tiene 5 lados y 5 vértices.'],
      ['Simetría: dos mitades iguales', 'Un eje de simetría divide una figura en dos partes que coinciden al doblar el papel.', 'Una mariposa tiene un eje de simetría en el centro.'],
      ['El perímetro es el borde', 'Para hallar el perímetro, suma la longitud de todos los lados. En la cuadrícula, cuenta los lados de los cuadritos del borde.', 'Un rectángulo de 5 cm × 3 cm: 5 + 3 + 5 + 3 = 16 cm.'],
      ['Perímetro es el borde; área es lo de adentro', 'El área se mide en unidades cuadradas: cuenta los cuadritos que quedan dentro de la figura.', 'Un rectángulo de 4 × 3 cuadritos tiene área 12 cm² y perímetro 14 cm.'],
      ['Área de rectángulos y triángulos', 'Rectángulo: base × altura. Triángulo: base × altura ÷ 2 (es la mitad de un rectángulo). Las figuras compuestas se dividen en partes.', 'Triángulo de base 8 cm y altura 5 cm: 8 × 5 ÷ 2 = 20 cm².'],
      ['Los ángulos miden aberturas', 'Agudo < 90°, recto = 90°, obtuso entre 90° y 180°, llano = 180°. Los ángulos de un triángulo suman 180°.', 'Si un triángulo tiene ángulos de 50° y 60°, el tercero mide 180° − 110° = 70°.'],
      ['El círculo y el número π', 'Longitud de la circunferencia L = 2πr; área A = πr². Usa π ≈ 3,14. El diámetro es el doble del radio.', 'r = 5 cm: L = 2 × 3,14 × 5 = 31,4 cm; A = 3,14 × 25 = 78,5 cm².'],
      ['Teorema de Pitágoras', 'En un triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos: c² = a² + b².', 'Catetos 6 y 8: c = √(36 + 64) = √100 = 10.'],
      ['Teorema de Pitágoras', 'Para hallar un cateto, resta: a² = c² − b². La hipotenusa es siempre el lado más largo, opuesto al ángulo recto.', 'Hipotenusa 13 y cateto 5: a = √(169 − 25) = √144 = 12.'],
      ['Geometría en el plano cartesiano', 'Distancia: d = √((x₂ − x₁)² + (y₂ − y₁)²). Pendiente: m = (y₂ − y₁)/(x₂ − x₁). Punto medio: promedio de las coordenadas.', 'A(1, 2) y B(4, 6): d = √(9 + 16) = 5; m = 4/3; M = (2,5; 4).'],
      ['Geometría en el plano cartesiano', 'La pendiente dice cuánto sube la recta por cada unidad que avanza. Positiva sube, negativa baja, cero es horizontal.', 'A(−2, 3) y B(2, −5): m = −8/4 = −2.']
    ],
    dinero: [
      ['Cada moneda tiene un valor', 'En Colombia usamos monedas de $50, $100, $200, $500 y $1.000. Cuenta cuántas hay y mira el número que tienen.', 'Tres monedas de $100 son $300.'],
      ['El valor importa más que la cantidad', 'Una moneda de $500 vale más que cuatro de $100. Para contar dinero, empieza por la de mayor valor.', '$500 + $200 + $100 = $800.'],
      ['Monedas y billetes', 'Los billetes colombianos son de $2.000, $5.000, $10.000, $20.000, $50.000 y $100.000. Suma primero los billetes y luego las monedas.', '$5.000 + $2.000 + $500 = $7.500.'],
      ['El vuelto es lo que te devuelven', 'Vuelto = lo que pagas − lo que cuesta. Puedes completar contando hacia arriba desde el precio.', 'Compras $3.700 y pagas con $5.000: vuelto $1.300.'],
      ['El vuelto es lo que te devuelven', 'Suma primero todo lo que compras y luego resta del billete con el que pagas.', '$1.500 + $2.300 = $3.800; con $10.000 te devuelven $6.200.'],
      ['Precio por cantidad', 'Si compras varias unidades, multiplica el precio por la cantidad antes de sumar.', '3 panelas de $2.500 = $7.500.'],
      ['Precio por cantidad', 'Compara totales para decidir. Revisa siempre que el vuelto sea menor que el billete.', '4 × $1.200 + 2 × $3.000 = $10.800; con $20.000 el vuelto es $9.200.'],
      ['Descuento e IVA', 'Descuento: se resta un porcentaje del precio. IVA (19 % en Colombia): se suma un porcentaje al precio.', '$50.000 con 20 % de descuento = $40.000. $100.000 + IVA = $119.000.'],
      ['Descuento e IVA', 'Para quitar el IVA de un total se divide entre 1,19 (no se resta el 19 % del total).', 'Total $238.000 → base = 238.000 ÷ 1,19 = $200.000.'],
      ['Presupuesto e interés simple', 'Un presupuesto reparte el ingreso en porcentajes. Interés simple: I = C · i · t (capital, tasa, tiempo).', '$1.000.000 al 6 % anual por 2 años: I = $120.000.'],
      ['Decisiones financieras inteligentes', 'Los descuentos sucesivos no se suman: se aplican uno tras otro. Monto = capital + interés.', '20 % y luego 10 % sobre $100.000: $80.000 → $72.000 (no $70.000).'],
      ['Decisiones financieras inteligentes', 'Antes de comprar o invertir, calcula: ¿cuánto pago de verdad?, ¿cuánto gano?, ¿cabe en mi presupuesto?', '$2.000.000 al 8 % simple por 3 años → monto $2.480.000.']
    ],
    error: [
      ['Equivocarse también enseña', 'Revisa si cada objeto se contó una sola vez.', 'Si cuento la misma estrella dos veces, digo un número mayor del real.'],
      ['Revisa paso a paso', 'El error más común al sumar es olvidar lo que se lleva; al restar, no prestar.', '47 + 38: 7 + 8 = 15, escribo 5 y llevo 1 → 85 (no 75).'],
      ['Revisa paso a paso', 'Cuando la cifra de arriba es menor, se presta una decena; nunca se resta al revés.', '52 − 27: 12 − 7 = 5 y 4 − 2 = 2 → 25 (no 35).'],
      ['Comprueba con la operación inversa', 'Una resta se comprueba sumando; una multiplicación, dividiendo.', '8 × 7 = 56 → 56 ÷ 7 = 8 ✔.'],
      ['Comprueba con la operación inversa', 'En la multiplicación también se lleva: no olvides sumarlo.', '36 × 4: 6 × 4 = 24, escribo 4 llevo 2; 3 × 4 + 2 = 14 → 144.'],
      ['Los denominadores no se suman', 'Error típico: 1/2 + 1/3 = 2/5 ✘. Lo correcto es buscar denominador común. En decimales, alinear la coma.', '1/2 + 1/3 = 3/6 + 2/6 = 5/6 ✔.'],
      ['El orden de las operaciones', 'Error típico: resolver de izquierda a derecha sin mirar la jerarquía, o creer que 2³ = 6.', '3 + 4 × 2 = 11 ✔ (no 14). 2³ = 8 ✔ (no 6).'],
      ['Cuidado con los signos', 'Error típico: −5 − (−3) = −8 ✘. Restar un negativo es sumar.', '−5 − (−3) = −5 + 3 = −2 ✔.'],
      ['Las propiedades tienen reglas', 'Error típico: (a + b)² = a² + b² ✘ y 2³ · 2² = 2⁶ ✘.', '(x + 3)² = x² + 6x + 9 ✔; 2³ · 2² = 2⁵ ✔.'],
      ['Lo que suma pasa a restar', 'Error típico: no cambiar el signo al trasponer o distribuir solo al primer término.', '2(x + 3) = 2x + 6 ✔ (no 2x + 3).'],
      ['Revisa las raíces y los valores notables', 'Si (x + 2) = 0 entonces x = −2 (signo contrario). sen 30° = 1/2, no √3/2.', 'x² + 5x + 6 = (x + 2)(x + 3) → x = −2 o x = −3 ✔.'],
      ['Las reglas del cálculo no son intuitivas', 'Error típico: (3x²)′ = 3x ✘ (falta multiplicar por 2) y log a + log b = log(a + b) ✘.', '(3x²)′ = 6x ✔; log₂ 8 + log₂ 4 = log₂ 32 = 5 ✔.']
    ]
  };
  var INSTR = {
    calculo: function (g) { return g === 0 ? 'Cuenta con tu dedo y escribe el número en la casilla.' : g >= 9 ? 'Resuelve cada ejercicio mostrando tus pasos en el cuaderno y escribe el resultado final.' : 'Resuelve cada operación y escribe el resultado. Las fracciones escríbelas como a/b.'; },
    problemas: function (g) { return g <= 1 ? 'Escucha o lee cada historia, piensa si juntas o quitas y escribe la respuesta.' : 'Lee cada problema, subraya los datos, resuelve y escribe la respuesta con su unidad.'; },
    series: function (g) { return g <= 1 ? 'Descubre el patrón y elige o escribe lo que sigue.' : 'Descubre la regla de cada serie y escribe lo que se pide.'; },
    geometria: function (g) { return 'Observa cada figura con atención y responde. Escribe las unidades (cm, m, cm², °).'; },
    dinero: function (g) { return g <= 2 ? 'Observa las monedas y los billetes y responde.' : 'Calcula y escribe la respuesta en pesos, por ejemplo $12.500.'; },
    error: function (g) { return 'Revisa cada ejercicio resuelto. Elige si está correcto o tiene un error y escribe el resultado correcto.'; }
  };
  var PENS = { calculo: 'Pensamiento numérico y sistemas numéricos', problemas: 'Pensamiento numérico · resolución de problemas', series: 'Pensamiento variacional y sistemas algebraicos', geometria: 'Pensamiento espacial y métrico', dinero: 'Pensamiento numérico · educación financiera', error: 'Razonamiento y argumentación' };

  /* ------------------------------------------------------------------ *
   * 13. API: TIPOS, GRADOS, generar
   * ------------------------------------------------------------------ */
  var TIPOS = [
    { id: 'calculo', nombre: 'Fichas de cálculo a medida', desc: 'Operaciones del grado, de contar a derivar.' },
    { id: 'problemas', nombre: 'Problemas cotidianos', desc: 'Historias de Cali: MIO, empanadas, Feria y más.' },
    { id: 'series', nombre: 'Series y patrones', desc: 'Figuras, números y sucesiones: ¿qué sigue?' },
    { id: 'geometria', nombre: 'Geometría visual', desc: 'Figuras, perímetros, áreas, ángulos y el plano.' },
    { id: 'dinero', nombre: 'Dinero y cambio', desc: 'Pesos colombianos, compras, vuelto, IVA e interés.' },
    { id: 'error', nombre: 'Encuentra el error', desc: 'Ejercicios resueltos: ¿están bien o tienen un error?' }
  ];
  var GRADOS = [{ n: 0, nombre: 'Transición' }];
  for (var gi = 1; gi <= 11; gi++) GRADOS.push({ n: gi, nombre: gi + '°' });

  function clampInt(v, a, b, d) { v = parseInt(v, 10); if (!isFinite(v)) return d; return Math.max(a, Math.min(b, v)); }
  function tipoValido(t) { for (var i = 0; i < TIPOS.length; i++) if (TIPOS[i].id === t) return t; return 'calculo'; }
  function semillaNueva() { return 1 + Math.floor(Math.random() * 999999); }
  function opciones(o) {
    o = o || {};
    return { grado: clampInt(o.grado, 0, 11, 3), tipo: tipoValido(o.tipo), cantidad: clampInt(o.cantidad, 6, 20, 10), semilla: (parseInt(o.semilla, 10) > 0 ? clampInt(o.semilla, 1, 999999999, 1) : semillaNueva()) };
  }

  function generadorItem(tipo, g, r, i, offset) {
    var nm = NOMBRES[(offset + i * 5) % NOMBRES.length];
    if (tipo === 'calculo') { var L = CALC[g]; return L[(offset + i) % L.length](r, g); }
    if (tipo === 'problemas') { var T2 = PROB.filter(function (t) { return (t.gmin || 0) <= g; }); return T2[(offset + i) % T2.length].f(r, g, nm); }
    if (tipo === 'series') { var S = SERIES_G[g]; return SERIES[S[(offset + i) % S.length]](r, g); }
    if (tipo === 'geometria') { var G = GEO_G[g]; return geoGen(G[(offset + i) % G.length], r, g); }
    if (tipo === 'dinero') { var D = DIN_G[g]; return DIN[D[(offset + i) % D.length]](r, g); }
    var E = ERR_G[g]; var conErr = r.b(0.6); return ERR[E[(offset + i) % E.length]](r, g, nm, conErr);
  }

  function generar(o) {
    o = opciones(o);
    var g = o.grado, tipo = o.tipo;
    var r = Rng(hashStr(tipo + '|' + g + '|' + o.semilla));
    var offset = r.i(0, 99), items = [], vistos = {};
    for (var i = 0; i < o.cantidad; i++) {
      var item = null;
      for (var t = 0; t < 40; t++) {
        item = generadorItem(tipo, g, r, i + t * 7, offset);
        var clave = item.enunciado + '|' + (item.svg || '') + '|' + item.respuesta;
        if (!vistos[clave]) { vistos[clave] = 1; break; }
      }
      items.push(item);
    }
    if (tipo === 'error') { // al menos un ejercicio correcto y uno con error
      var hayE = items.some(function (x) { return x.veredicto === 'error'; }), hayC = items.some(function (x) { return x.veredicto === 'correcto'; });
      if (!hayE || !hayC) {
        var E = ERR_G[g], nm = NOMBRES[offset % NOMBRES.length];
        items[items.length - 1] = ERR[E[0]](r, g, nm, !hayE);
      }
    }
    var id = IDEAS[tipo][g], tp = TIPOS.filter(function (x) { return x.id === tipo; })[0];
    return {
      titulo: tp.nombre + ' · ' + GRADOS[g].nombre,
      tipo: tipo, grado: g, semilla: o.semilla, cantidad: o.cantidad,
      pensamiento: PENS[tipo],
      idea: { titulo: id[0], texto: id[1], ejemplo: id[2] },
      instruccion: INSTR[tipo](g),
      items: items
    };
  }

  /* ------------------------------------------------------------------ *
   * 14. Estilos (inyectados una vez)
   * ------------------------------------------------------------------ */
  var CSS = [
    '.sf-ficha{--sf-navy:#073B7A;--sf-blue:#064FAE;--sf-orange:#FF8A00;--sf-gold:#F5C518;--sf-green:#108A4F;--sf-red:#C0392B;--sf-ink:#1E2433;--sf-line:#D5DEEA;font-family:"Public Sans",system-ui,Arial,sans-serif;color:var(--sf-ink);background:#fff;border-radius:18px;box-shadow:0 6px 24px rgba(7,59,122,.10);padding:22px;max-width:880px;margin:0 auto;box-sizing:border-box;overflow-wrap:anywhere}',
    '.sf-ficha *{box-sizing:border-box}',
    '.sf-cab{border-bottom:3px solid var(--sf-navy);padding-bottom:12px;margin-bottom:16px}',
    '.sf-marca{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:.8rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--sf-blue)}',
    '.sf-marca span:last-child{color:#5A6478;font-weight:600;text-transform:none;letter-spacing:0}',
    '.sf-titulo{font-size:1.55rem;line-height:1.2;margin:.35em 0 .5em;color:var(--sf-navy);font-weight:800}',
    '.sf-campos{display:grid;grid-template-columns:2fr 1fr;gap:8px 16px;font-size:1rem}',
    '.sf-campo{display:flex;align-items:flex-end;gap:6px;min-width:0}',
    '.sf-campo b{white-space:nowrap}',
    '.sf-campo input{flex:1;min-width:0;border:0;border-bottom:2px dotted #8C9AB0;font:inherit;padding:2px 4px;background:transparent}',
    '.sf-idea{position:relative;background:#FFF7E6;border:2px solid var(--sf-gold);border-radius:14px;padding:14px 16px 14px;margin:0 0 16px}',
    '.sf-idea-et{display:inline-block;background:var(--sf-orange);color:#fff;font-weight:800;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;border-radius:999px;padding:3px 10px}',
    '.sf-lema{margin:.4em 0 .2em;font-style:italic;color:#7A5200;font-size:.92rem}',
    '.sf-idea h3{margin:.2em 0 .3em;font-size:1.2rem;color:var(--sf-navy)}',
    '.sf-idea p{margin:.3em 0;font-family:Literata,Georgia,serif;font-size:1.08rem;line-height:1.5}',
    '.sf-ej{margin-top:8px;background:#fff;border-left:5px solid var(--sf-green);border-radius:8px;padding:8px 12px;font-family:Literata,Georgia,serif;font-size:1.05rem;line-height:1.5}',
    '.sf-ej b{font-family:"Public Sans",Arial,sans-serif;color:var(--sf-green)}',
    '.sf-instr{font-weight:700;font-size:1.05rem;margin:0 0 12px;color:var(--sf-navy)}',
    '.sf-items{list-style:none;margin:0;padding:0;display:grid;gap:12px}',
    '.sf-item{display:flex;gap:12px;border:1.5px solid var(--sf-line);border-radius:14px;padding:14px;break-inside:avoid;page-break-inside:avoid;background:#fff}',
    '.sf-n{flex:0 0 36px;height:36px;border-radius:50%;background:var(--sf-navy);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:1.05rem}',
    '.sf-cuerpo{flex:1;min-width:0}',
    '.sf-enun{font-family:Literata,Georgia,serif;font-size:1.3rem;line-height:1.55}',
    '.sf-g0 .sf-enun,.sf-g1 .sf-enun,.sf-g2 .sf-enun{font-size:1.45rem}',
    '.sf-enun sup,.sf-enun sub{font-size:.68em}',
    '.sf-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em;font-size:.95em}',
    '.sf-frac>span:first-child{border-bottom:2px solid currentColor;padding:0 .2em}',
    '.sf-frac>span:last-child{padding:0 .2em}',
    '.sf-quien{display:block;font-family:"Public Sans",Arial,sans-serif;font-size:1rem;color:#5A6478;font-weight:700}',
    '.sf-pasos{margin:.3em 0 0;padding-left:1.4em}',
    '.sf-pasos li{margin:.15em 0}',
    '.sf-fig{margin:10px 0 4px}',
    '.sf-svg{display:block;width:100%;height:auto}',
    '.sf-dos{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.sf-dos>div{border:1.5px dashed var(--sf-line);border-radius:10px;padding:6px;min-width:0}',
    '.sf-dos b{display:block;font-size:1rem;color:var(--sf-navy);margin-bottom:4px}',
    '.sf-resp{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px}',
    '.sf-resp label.sf-et{font-weight:700;font-size:.95rem;color:#5A6478}',
    '.sf-in{font:inherit;font-family:Literata,Georgia,serif;font-size:1.25rem;padding:8px 12px;border:2px solid #9FB1CC;border-radius:10px;width:100%;max-width:280px;min-width:0;background:#FBFCFE;color:var(--sf-ink)}',
    '.sf-in:focus,.sf-sel:focus{outline:3px solid rgba(255,138,0,.45);border-color:var(--sf-orange)}',
    '.sf-sel{font:inherit;font-size:1.05rem;padding:8px 10px;border:2px solid #9FB1CC;border-radius:10px;background:#FBFCFE;max-width:100%}',
    '.sf-opcs{display:flex;flex-wrap:wrap;gap:8px}',
    '.sf-opc{display:inline-flex;align-items:center;gap:8px;border:2px solid #9FB1CC;border-radius:12px;padding:6px 12px;cursor:pointer;font-size:1.1rem;background:#FBFCFE;min-height:44px}',
    '.sf-opc input{width:20px;height:20px;accent-color:var(--sf-blue)}',
    '.sf-opc .sf-svg{width:36px}',
    '.sf-opc:has(input:checked){border-color:var(--sf-blue);background:#E9F0FA}',
    '.sf-marca-r{font-size:1.6rem;font-weight:800;min-width:1.2em}',
    '.sf-ok{border-color:var(--sf-green);background:#F1FAF4}.sf-ok .sf-marca-r{color:var(--sf-green)}',
    '.sf-mal{border-color:var(--sf-red);background:#FDF3F2}.sf-mal .sf-marca-r{color:var(--sf-red)}',
    '.sf-fb{display:none;margin-top:8px;font-size:1rem;line-height:1.45;border-radius:10px;padding:8px 12px;background:#fff;border-left:5px solid var(--sf-red)}',
    '.sf-mal .sf-fb{display:block}',
    '.sf-sol{display:none;margin-top:8px;font-weight:700;color:var(--sf-green);font-size:1.05rem}',
    '.sf-ver .sf-sol{display:block}',
    '.sf-acciones{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 8px}',
    '.sf-btn{font:inherit;font-weight:800;font-size:1rem;border:0;border-radius:12px;padding:12px 16px;cursor:pointer;min-height:46px;color:#fff;background:var(--sf-blue)}',
    '.sf-btn:hover{filter:brightness(1.08)}.sf-btn:focus-visible{outline:3px solid var(--sf-gold);outline-offset:2px}',
    '.sf-btn.sf-rev{background:var(--sf-green)}.sf-btn.sf-otra{background:var(--sf-orange);color:#1E2433}.sf-btn.sf-imp{background:var(--sf-navy)}.sf-btn.sf-verb{background:#fff;color:var(--sf-blue);border:2px solid var(--sf-blue)}',
    '.sf-puntaje{font-size:1.15rem;font-weight:800;color:var(--sf-navy);min-height:1.4em}',
    '.sf-puntaje small{display:block;font-weight:600;color:#5A6478;font-size:.95rem;margin-top:2px}',
    '.sf-clave{display:none;margin-top:20px;border-top:3px solid var(--sf-navy);padding-top:12px}',
    '.sf-ver .sf-clave{display:block}',
    '.sf-clave h3{margin:0 0 6px;color:var(--sf-navy)}',
    '.sf-clave ol{margin:0;padding-left:1.6em;font-family:Literata,Georgia,serif;font-size:1.05rem;line-height:1.5}',
    '.sf-clave li span{color:#5A6478;font-size:.92rem;display:block}',
    '.sf-pie{margin-top:14px;font-size:.82rem;color:#5A6478;text-align:center}',
    '@media (max-width:560px){.sf-ficha{padding:14px;border-radius:12px}.sf-titulo{font-size:1.25rem}.sf-campos{grid-template-columns:1fr}.sf-item{padding:10px;gap:8px}.sf-n{flex-basis:30px;height:30px;font-size:.95rem}.sf-enun{font-size:1.15rem}.sf-g0 .sf-enun,.sf-g1 .sf-enun,.sf-g2 .sf-enun{font-size:1.25rem}.sf-dos{grid-template-columns:1fr}.sf-btn{flex:1 1 45%}}',
    '@media print{',
    ' @page{margin:14mm}',
    ' .sf-ficha{box-shadow:none;padding:0;max-width:none;border-radius:0;color:#000}',
    ' .sf-acciones,.sf-puntaje,.sf-fb,.sf-sol,.sf-marca-r{display:none!important}',
    ' .sf-item,.sf-ok,.sf-mal{border:1px solid #888;background:#fff!important}',
    ' .sf-n{background:#fff;color:#000;border:2px solid #000}',
    ' .sf-idea{background:#fff;border:1.5px solid #000}.sf-idea-et{background:#fff;color:#000;border:1.5px solid #000}.sf-lema{color:#000}.sf-ej{border-left-color:#000}.sf-ej b,.sf-titulo,.sf-idea h3,.sf-instr,.sf-marca{color:#000}',
    ' .sf-in,.sf-campo input{border:0;border-bottom:1.5px solid #000;border-radius:0;background:transparent;color:transparent;max-width:none;width:70%}',
    ' .sf-sel{border:1px solid #000;appearance:none;-webkit-appearance:none;color:transparent;min-width:9em;background:#fff}',
    ' .sf-opc{border:1px solid #000;background:#fff!important}',
    ' .sf-enun{font-size:13pt}.sf-g0 .sf-enun,.sf-g1 .sf-enun,.sf-g2 .sf-enun{font-size:15pt}',
    ' .sf-clave{display:block!important;break-before:page;page-break-before:always;border-top:0}',
    ' .sf-svg{max-height:60mm}',
    '}'
  ].join('\n');
  function inyectarCSS(doc) {
    if (doc.getElementById('sf-estilos')) return;
    var st = doc.createElement('style'); st.id = 'sf-estilos'; st.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(st);
  }

  /* ------------------------------------------------------------------ *
   * 15. montar: ficha interactiva
   * ------------------------------------------------------------------ */
  var uid = 0;
  function montar(cont, o) {
    if (typeof cont === 'string') cont = document.querySelector(cont);
    if (!cont) throw new Error('SabiFichas.montar: contenedor no encontrado');
    var doc = cont.ownerDocument || document;
    inyectarCSS(doc);
    var f = generar(o), id = 'sf' + (++uid);
    var h = [];
    h.push('<article class="sf-ficha sf-g' + f.grado + '" data-tipo="' + f.tipo + '" data-grado="' + f.grado + '" data-semilla="' + f.semilla + '">');
    h.push('<header class="sf-cab"><div class="sf-marca"><span>AI CENTEC · Fichas de matemáticas</span><span>' + esc(f.pensamiento) + '</span></div>');
    h.push('<h2 class="sf-titulo">' + esc(f.titulo) + '</h2>');
    h.push('<div class="sf-campos"><label class="sf-campo"><b>Nombre:</b><input type="text" autocomplete="off" aria-label="Nombre"></label><label class="sf-campo"><b>Fecha:</b><input type="text" autocomplete="off" aria-label="Fecha"></label>');
    h.push('<div class="sf-campo"><b>Grado:</b> ' + esc(GRADOS[f.grado].nombre) + '</div><div class="sf-campo"><b>Ficha N°</b> ' + f.semilla + '</div></div></header>');
    h.push('<section class="sf-idea" aria-label="Idea clave"><span class="sf-idea-et">Idea clave</span><p class="sf-lema">Una buena ficha empieza con una buena idea.</p><h3>' + esc(f.idea.titulo) + '</h3><p>' + esc(f.idea.texto) + '</p><div class="sf-ej"><b>Ejemplo:</b> ' + esc(f.idea.ejemplo) + '</div></section>');
    h.push('<p class="sf-instr">' + esc(f.instruccion) + '</p><ol class="sf-items">');
    f.items.forEach(function (itm, i) {
      h.push('<li class="sf-item" data-i="' + i + '"><div class="sf-n" aria-hidden="true">' + (i + 1) + '</div><div class="sf-cuerpo">');
      h.push('<div class="sf-enun">' + itm.enunciado + '</div>');
      if (itm.svg) h.push('<div class="sf-fig">' + itm.svg + '</div>');
      h.push('<div class="sf-resp">');
      var lbl = 'Respuesta ' + (i + 1);
      if (itm.opciones) {
        h.push('<div class="sf-opcs" role="radiogroup" aria-label="' + lbl + '">');
        itm.opciones.forEach(function (op) { h.push('<label class="sf-opc"><input type="radio" name="' + id + '-' + i + '" value="' + esc(op.v) + '">' + op.html + '</label>'); });
        h.push('</div>');
      } else if (itm.modo === 'error') {
        h.push('<select class="sf-sel" aria-label="¿Correcto o con error? ' + (i + 1) + '"><option value="">¿Está bien?</option><option value="correcto">Correcto</option><option value="error">Tiene un error</option></select>');
        h.push('<input class="sf-in" type="text" autocomplete="off" spellcheck="false" placeholder="Resultado correcto" aria-label="Resultado correcto ' + (i + 1) + '">');
      } else {
        h.push('<input class="sf-in" type="text" autocomplete="off" spellcheck="false" ' + (itm.poly ? '' : 'inputmode="text" ') + 'placeholder="' + esc(itm.ayuda || 'Tu respuesta') + '" aria-label="' + lbl + '">');
      }
      h.push('<span class="sf-marca-r" aria-live="polite"></span></div>');
      h.push('<div class="sf-fb"></div><div class="sf-sol">Respuesta: ' + esc(itm.respuesta) + '</div>');
      h.push('</div></li>');
    });
    h.push('</ol>');
    h.push('<div class="sf-acciones"><button type="button" class="sf-btn sf-rev">Revisar mis respuestas</button><button type="button" class="sf-btn sf-verb">Ver respuestas</button><button type="button" class="sf-btn sf-otra">Otra ficha</button><button type="button" class="sf-btn sf-imp">Imprimir</button></div>');
    h.push('<div class="sf-puntaje" aria-live="polite"></div>');
    h.push('<section class="sf-clave"><h3>Clave de respuestas · Ficha N° ' + f.semilla + '</h3><ol>');
    f.items.forEach(function (itm) { h.push('<li>' + esc(itm.respuesta) + (itm.explicacion ? '<span>' + esc(itm.explicacion) + '</span>' : '') + '</li>'); });
    h.push('</ol></section>');
    h.push('<p class="sf-pie">AI CENTEC · Colegio CENTEC, Cali · Ficha generada por código: misma ficha N°, mismo grado y tipo = misma ficha.</p>');
    h.push('</article>');
    cont.innerHTML = h.join('');

    var art = cont.querySelector('.sf-ficha');
    function valorDe(li, itm) {
      if (itm.opciones) { var ch = li.querySelector('input[type=radio]:checked'); return ch ? ch.value : ''; }
      if (itm.modo === 'error') return { veredicto: li.querySelector('.sf-sel').value, texto: li.querySelector('.sf-in').value };
      return li.querySelector('.sf-in').value;
    }
    art.querySelector('.sf-rev').addEventListener('click', function () {
      var ok = 0, lis = art.querySelectorAll('.sf-item');
      for (var i = 0; i < lis.length; i++) {
        var li = lis[i], itm = f.items[i], bien = revisar(itm, valorDe(li, itm));
        li.classList.remove('sf-ok', 'sf-mal'); li.classList.add(bien ? 'sf-ok' : 'sf-mal');
        li.querySelector('.sf-marca-r').textContent = bien ? '✔' : '✘';
        li.querySelector('.sf-fb').textContent = bien ? '' : itm.explicacion;
        if (bien) ok++;
      }
      var n = f.items.length, msg = ok === n ? '¡Excelente! Dominas este tema. Prueba con «Otra ficha» o sube el nivel.' : ok >= n * 0.7 ? 'Muy bien. Lee la explicación de los que fallaste e inténtalo otra vez.' : 'Vas en camino. Lee la Idea clave, revisa las explicaciones y vuelve a intentarlo: así se aprende.';
      art.querySelector('.sf-puntaje').innerHTML = 'Obtuviste ' + ok + ' de ' + n + '.<small>' + esc(msg) + '</small>';
      art.setAttribute('data-puntaje', ok + '/' + n);
    });
    art.querySelector('.sf-verb').addEventListener('click', function () {
      var v = art.classList.toggle('sf-ver'); this.textContent = v ? 'Ocultar respuestas' : 'Ver respuestas';
    });
    art.querySelector('.sf-otra').addEventListener('click', function () {
      var nuevo = { grado: f.grado, tipo: f.tipo, cantidad: f.cantidad, semilla: semillaNueva() };
      montar(cont, nuevo);
      try { cont.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { }
    });
    art.querySelector('.sf-imp').addEventListener('click', function () { (doc.defaultView || window).print(); });
    try {
      var ev; var det = { grado: f.grado, tipo: f.tipo, cantidad: f.cantidad, semilla: f.semilla };
      if (typeof CustomEvent === 'function') ev = new CustomEvent('sabifichas:montada', { detail: det, bubbles: true });
      else { ev = doc.createEvent('CustomEvent'); ev.initCustomEvent('sabifichas:montada', true, false, det); }
      cont.dispatchEvent(ev);
    } catch (e) { }
    return f;
  }

  root.SabiFichas = {
    TIPOS: TIPOS,
    GRADOS: GRADOS,
    generar: generar,
    montar: montar,
    revisar: revisar,
    version: '1.0.0'
  };
})(typeof window !== 'undefined' ? window : this);
