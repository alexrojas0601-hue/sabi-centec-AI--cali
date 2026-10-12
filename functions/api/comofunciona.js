// AI CENTEC · ¿Cómo funciona? — explicación de objetos, máquinas y procesos del mundo real
// Cloudflare Pages Function → https://ai.sabicentec.com/api/comofunciona?q=nevera
// Fuente: Wikipedia en español (CC BY-SA 4.0, se cita siempre). Cualquier app SABI puede llamarla (CORS abierto).

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const UA = 'AI-CENTEC/1.0 (https://ai.sabicentec.com; colegio CENTEC Cali)';
const WIKI = 'https://es.wikipedia.org/w/api.php';

// Secciones que suelen explicar el funcionamiento, en orden de preferencia
const SECCIONES = /^(funcionamiento|principio de funcionamiento|principios? de operaci[oó]n|c[oó]mo funciona|operaci[oó]n|mecanismo|fundamento|descripci[oó]n|dise[nñ]o|componentes|proceso|fabricaci[oó]n|elaboraci[oó]n|producci[oó]n)/i;

// Quita lo que sobra de la pregunta: "¿cómo funciona una nevera?" → "nevera"
function tema(q) {
  return String(q || '')
    .toLowerCase()
    .replace(/[¿?¡!.,;:"'()]/g, ' ')
    .replace(/\b(c[oó]mo|funciona(n)?|funcionamiento|se|hace(n)?|fabrica(n)?|elabora(n)?|produce(n)?|trabaja(n)?|opera(n)?|explica(me)?|expl[ií]came|qu[eé]|es|son|un|una|unos|unas|el|la|los|las|de|del|por|dentro|interior|para|sirve(n)?|me|mi|quiero|saber|entender|aprender|dime)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function wiki(params) {
  const url = WIKI + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params });
  const r = await fetch(url, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 86400 } });
  if (!r.ok) throw new Error('wikipedia HTTP ' + r.status);
  return r.json();
}

function partirSecciones(texto) {
  // explaintext marca secciones como "== Título ==" / "=== Sub ==="
  const partes = texto.split(/\n(={2,4})\s*([^=\n]+?)\s*\1\n/);
  const intro = partes[0].trim();
  const secciones = [];
  for (let i = 1; i < partes.length; i += 3) {
    secciones.push({ titulo: partes[i + 1].trim(), texto: (partes[i + 2] || '').trim() });
  }
  return { intro, secciones };
}

function recortar(t, max) {
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const fin = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'));
  return (fin > max * 0.5 ? cut.slice(0, fin + 1) : cut) + ' […]';
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ request }) {
  const q = new URL(request.url).searchParams.get('q') || '';
  const buscado = tema(q) || q.trim();
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
    status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
  if (!buscado) return json({ ok: false, error: 'Falta el parámetro q (ej. ?q=nevera)' }, 400);

  try {
    const s = await wiki({ action: 'query', list: 'search', srsearch: buscado, srlimit: '3', srprop: '' });
    const hit = s.query && s.query.search && s.query.search[0];
    if (!hit) return json({ ok: false, tema: buscado, error: 'No se encontró un artículo sobre ese tema.' }, 404);

    const p = await wiki({
      action: 'query', prop: 'extracts|pageimages|info', titles: hit.title, redirects: '1',
      explaintext: '1', piprop: 'thumbnail', pithumbsize: '640', inprop: 'url',
    });
    const page = p.query.pages[0];
    const { intro, secciones } = partirSecciones(page.extract || '');
    const sec = secciones.find((x) => SECCIONES.test(x.titulo) && x.texto.length > 120);

    return json({
      ok: true,
      tema: buscado,
      titulo: page.title,
      resumen: recortar(intro, 1200),
      funcionamiento: sec ? { seccion: sec.titulo, texto: recortar(sec.texto, 3000) } : null,
      imagen: page.thumbnail ? page.thumbnail.source : null,
      url: page.fullurl,
      video: 'https://www.youtube.com/results?search_query=' + encodeURIComponent('cómo funciona ' + page.title + ' animación explicación'),
      fuente: 'Wikipedia en español',
      licencia: 'CC BY-SA 4.0',
    });
  } catch (e) {
    return json({ ok: false, tema: buscado, error: String(e.message || e) }, 502);
  }
}
