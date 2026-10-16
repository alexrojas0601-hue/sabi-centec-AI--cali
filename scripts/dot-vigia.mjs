// ============================================================================
// AI CENTEC · Dot Vigía (auditor técnico permanente, sin IA)
// ----------------------------------------------------------------------------
// Verifica que la IA de sabicentec.com siga viva y sana:
//   1. El código de la app no tiene errores de sintaxis (index.html, sabi-dots.js, sabi-recursos.js).
//   2. El motor de gráficas y el generador de crucigramas funcionan con casos de prueba.
//   3. Los servicios en vivo responden: IA institucional (versión), clima/noticias, ¿cómo funciona?,
//      radar del futuro y retos de la semana.
// Deja el informe en data/vigia.json. Si algo falla, el workflow abre un Issue para el equipo.
//   node scripts/dot-vigia.mjs            (VIGIA_SIN_RED=1 para omitir las pruebas de red)
// ============================================================================
import { readFile, writeFile, mkdir } from "node:fs/promises";
import vm from "node:vm";

const resultados = [];
const ok = (nombre, detalle = "") => resultados.push({ nombre, ok: true, detalle });
const falla = (nombre, detalle) => resultados.push({ nombre, ok: false, detalle: String(detalle).slice(0, 300) });

// 1. Sintaxis
async function sintaxis() {
  const html = await readFile("index.html", "utf8");
  [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m, i) => {
    try { new vm.Script(m[1]); ok(`index.html · script ${i + 1}`); } catch (e) { falla(`index.html · script ${i + 1}`, e.message); }
  });
  for (const f of ["sabi-dots.js", "sabi-recursos.js", "sabi-vivo.js", "sw.js"]) {
    try { new vm.Script(await readFile(f, "utf8")); ok(f); } catch (e) { falla(f, e.message); }
  }
  try { JSON.parse(await readFile("manifest.webmanifest", "utf8")); ok("manifest.webmanifest"); } catch (e) { falla("manifest.webmanifest", e.message); }
}

// 2. Pruebas funcionales de los recursos
async function funcionales() {
  const ctx = { window: {}, document: { head: { appendChild() {} }, getElementById: () => null }, console };
  vm.createContext(ctx);
  vm.runInContext(await readFile("sabi-dots.js", "utf8"), ctx);
  vm.runInContext(await readFile("sabi-recursos.js", "utf8"), ctx);
  const R = ctx.window.SabiRecursos, D = ctx.window.SabiDots;
  const casos = [["x^2-4", 3, 5], ["2sin(x)", Math.PI / 2, 2], ["200000*(1.01)^x", 12, 225365.006], ["(x+1)(x-1)", 3, 8], ["-2^2", 0, -4], ["√(x+4)", 5, 3]];
  for (const [e, x, esperado] of casos) {
    const v = R.compilar(e)(x);
    Math.abs(v - esperado) < 1e-2 ? ok(`gráfica · ${e}`) : falla(`gráfica · ${e}`, `dio ${v}, esperado ${esperado}`);
  }
  try { R.compilar("alert(1)"); falla("gráfica · bloqueo de código", "aceptó una expresión peligrosa"); } catch { ok("gráfica · bloqueo de código"); }
  const cw = R.armarCrucigrama([{ palabra: "AHORRO", pista: "a" }, { palabra: "INTERES", pista: "b" }, { palabra: "CAPITAL", pista: "c" }, { palabra: "TASA", pista: "d" }]);
  cw && cw.pl.length >= 3 ? ok("crucigrama · generador", `${cw.pl.length} palabras cruzadas`) : falla("crucigrama · generador", "no cruzó las palabras");
  const ex = R.extraer('Hola\n```sabi\n{"tipo":"quiz","preguntas":[]}\n```\n```mermaid\nflowchart TD\nA-->B\n```');
  ex.recursos.length === 2 ? ok("extracción de bloques") : falla("extracción de bloques", JSON.stringify(ex.recursos));
  const rutas = [["¿Qué es el interés compuesto?", "Dot_Matematicas_Estrategica"], ["Explain the present perfect", "Dot_Bilinguismo_Ingles"], ["Me siento ansioso antes del examen", "Dot_InteligenciaEmocional_Valores"], ["¿Cómo funciona un robot?", "Dot_EducacionDigital_IA"], ["La fotosíntesis", "Dot_CienciasNaturales_STEAM"], ["Causas de la independencia de Colombia", "Dot_CienciasSociales_Ciudadanas"]];
  for (const [q, dot] of rutas) { const r = D.elegirDot(q); r === dot ? ok(`Dot · ${q}`) : falla(`Dot · ${q}`, `eligió ${r}, esperado ${dot}`); }
}

// 3. Servicios en vivo
async function red(nombre, url, validar, opciones = {}) {
  try {
    const r = await fetch(url, { ...opciones, signal: AbortSignal.timeout(20000) });
    const tipo = r.headers.get("content-type") || "";
    const cuerpo = tipo.includes("json") ? await r.json() : await r.text();
    if (!r.ok) return falla(nombre, `HTTP ${r.status}`);
    const v = validar(cuerpo);
    v === true ? ok(nombre) : falla(nombre, v || "respuesta inesperada");
  } catch (e) { falla(nombre, e.message); }
}
async function servicios() {
  const origen = { headers: { origin: "https://sabicentec.com" } };
  await red("IA institucional · versión", "https://superacion.sabicentec.com/api/institucional", (d) => (d.ok && d.version ? true : "sin versión (¿no se publicó la v3?)"), origen);
  await red("En vivo · clima de Cali", "https://ai.sabicentec.com/api/actualidad?clima=1&noticias=0", (d) => (d.clima ? true : d.climaError || "sin clima"));
  await red("En vivo · noticias", "https://ai.sabicentec.com/api/actualidad?clima=0&noticias=1&frente=educacion", (d) => (d.noticias && d.noticias.length ? true : d.noticiasError || "sin noticias"));
  await red("¿Cómo funciona?", "https://ai.sabicentec.com/api/comofunciona?q=nevera", (d) => (d.ok ? true : d.error));
  await red("Radar del futuro", "https://superacion.sabicentec.com/data/tendencias.json", (d) => ((d.tendencias || []).length ? true : "vacío"));
  await red("Retos de la semana", "https://superacion.sabicentec.com/data/recursos.json", (d) => ((d.recursos || []).length ? true : "vacío"));
  await red("Portada sabicentec.com", "https://sabicentec.com/", (t) => (String(t).includes("sabi-recursos.js") ? true : "la portada publicada no carga sabi-recursos.js"));
}

await sintaxis();
await funcionales();
if (!process.env.VIGIA_SIN_RED) await servicios();

const fallas = resultados.filter((r) => !r.ok);
const informe = { fecha: new Date().toISOString(), total: resultados.length, fallas: fallas.length, resultados };
await mkdir("data", { recursive: true });
await writeFile("data/vigia.json", JSON.stringify(informe, null, 1) + "\n");
const md = [`# Dot Vigía · ${informe.fecha.slice(0, 10)}`, "", `**${resultados.length - fallas.length} de ${resultados.length} verificaciones OK**`, "",
  ...resultados.map((r) => `- ${r.ok ? "✅" : "❌"} ${r.nombre}${r.detalle ? " — " + r.detalle : ""}`)].join("\n");
await writeFile("data/vigia.md", md + "\n");
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, md + "\n", { flag: "a" });
console.log(md);
process.exit(fallas.length ? 1 : 0);
