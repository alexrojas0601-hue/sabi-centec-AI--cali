// AI CENTEC · Datos en vivo de Cali (clima + noticias del día)
// Cloudflare Pages Function → https://ai.sabicentec.com/api/actualidad?clima=1&noticias=1
// Clima: Open-Meteo (gratis, sin clave). Noticias: Google Noticias RSS (últimas 24 h), respaldo GDELT.
// ?frente=cali | colombia | mundo | educacion  (por defecto cali)

const CALI = { lat: 3.4516, lon: -76.532 };
const TZ = 'America/Bogota';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CODIGOS_CLIMA = {
  0: 'despejado', 1: 'mayormente despejado', 2: 'parcialmente nublado', 3: 'nublado',
  45: 'neblina', 48: 'neblina con escarcha',
  51: 'llovizna débil', 53: 'llovizna', 55: 'llovizna intensa',
  61: 'lluvia débil', 63: 'lluvia moderada', 65: 'lluvia fuerte',
  80: 'chubascos débiles', 81: 'chubascos', 82: 'chubascos fuertes',
  95: 'tormenta eléctrica', 96: 'tormenta con granizo', 99: 'tormenta fuerte con granizo',
};

function ahoraBogota() {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date());
}

async function traerClima() {
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${CALI.lat}&longitude=${CALI.lon}`
    + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m'
    + '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max'
    + `&timezone=${encodeURIComponent(TZ)}&forecast_days=1`;
  const r = await fetch(url, { cf: { cacheTtl: 600 } });
  if (!r.ok) throw new Error('clima HTTP ' + r.status);
  const d = await r.json();
  const c = d.current || {}, dd = d.daily || {};
  return {
    fuente: 'Open-Meteo',
    fuenteUrl: 'https://open-meteo.com/',
    estado: CODIGOS_CLIMA[c.weather_code] || 'condición variable',
    temperatura: c.temperature_2m,
    sensacion: c.apparent_temperature,
    humedad: c.relative_humidity_2m,
    viento: c.wind_speed_10m,
    lluviaAhora: c.precipitation,
    maxima: dd.temperature_2m_max && dd.temperature_2m_max[0],
    minima: dd.temperature_2m_min && dd.temperature_2m_min[0],
    probLluvia: dd.precipitation_probability_max && dd.precipitation_probability_max[0],
    uv: dd.uv_index_max && dd.uv_index_max[0],
  };
}

function limpiar(t) {
  return String(t || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '').trim();
}

function etiqueta(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? limpiar(m[1]) : '';
}

// Frentes de actualidad: qué buscar en Google Noticias y en GDELT
const FRENTES = {
  cali:      { google: 'Cali when:1d', gdelt: 'Cali sourcecountry:colombia' },
  colombia:  { google: 'Colombia when:1d', gdelt: 'Colombia sourcecountry:colombia' },
  mundo:     { google: null, gdelt: 'sourcelang:spanish' },
  educacion: { google: '(MEN OR ICFES OR "Ministerio de Educación" OR colegios) Colombia when:2d', gdelt: '(ICFES OR "Ministerio de Educacion") sourcecountry:colombia' },
};

async function noticiasGoogle(frente) {
  const f = FRENTES[frente] || FRENTES.cali;
  const url = f.google
    ? 'https://news.google.com/rss/search?q=' + encodeURIComponent(f.google) + '&hl=es-419&gl=CO&ceid=CO:es-419'
    : 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=es-419&gl=CO&ceid=CO:es-419';
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (AI CENTEC; +https://ai.sabicentec.com)' },
    cf: { cacheTtl: 900 },
  });
  if (!r.ok) throw new Error('google HTTP ' + r.status);
  const xml = await r.text();
  const items = xml.split('<item>').slice(1, 7).map((it) => {
    const fuente = etiqueta(it, 'source');
    let titulo = etiqueta(it, 'title');
    if (fuente && titulo.endsWith(' - ' + fuente)) titulo = titulo.slice(0, -(fuente.length + 3));
    return { titulo, fuente, url: etiqueta(it, 'link'), fecha: etiqueta(it, 'pubDate') };
  }).filter((n) => n.titulo && n.url);
  if (!items.length) throw new Error('google sin resultados');
  return items;
}

async function noticiasGdelt(frente) {
  const f = FRENTES[frente] || FRENTES.cali;
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=' + encodeURIComponent(f.gdelt) + '&mode=artlist&maxrecords=6&timespan=1d&sort=hybridrel&format=json';
  const r = await fetch(url, { cf: { cacheTtl: 900 } });
  if (!r.ok) throw new Error('gdelt HTTP ' + r.status);
  const d = await r.json();
  const items = (d.articles || []).map((a) => ({ titulo: a.title, fuente: a.domain, url: a.url, fecha: a.seendate }));
  if (!items.length) throw new Error('gdelt sin resultados');
  return items;
}

async function traerNoticias(frente) {
  try { return await noticiasGoogle(frente); } catch (e) { return await noticiasGdelt(frente); }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ request }) {
  const p = new URL(request.url).searchParams;
  const quiereClima = p.get('clima') !== '0';
  const quiereNoticias = p.get('noticias') !== '0';
  const frente = FRENTES[p.get('frente')] ? p.get('frente') : 'cali';
  const res = { ok: true, ciudad: 'Cali, Colombia', frente, consultado: ahoraBogota() };

  const [clima, noticias] = await Promise.allSettled([
    quiereClima ? traerClima() : Promise.resolve(null),
    quiereNoticias ? traerNoticias(frente) : Promise.resolve(null),
  ]);
  if (clima.status === 'fulfilled' && clima.value) res.clima = clima.value;
  else if (quiereClima) res.climaError = String(clima.reason && clima.reason.message || clima.reason);
  if (noticias.status === 'fulfilled' && noticias.value) res.noticias = noticias.value;
  else if (quiereNoticias) res.noticiasError = String(noticias.reason && noticias.reason.message || noticias.reason);

  return new Response(JSON.stringify(res), {
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=600' },
  });
}
