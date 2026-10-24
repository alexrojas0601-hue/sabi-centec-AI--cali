# Instrucciones para Claude en este repositorio

Aplicación: **AI CENTEC · IA institucional de CENTEC (ai.sabicentec.com)**. Hace parte del ecosistema SABI CENTEC del Colegio CENTEC Córdoba (Comuna 15, Cali).

## Regla principal
Toda tarea en este repositorio sigue `docs/PROMPT-MAESTRO-SABI.md`, la gobernanza común del ecosistema. Incluye los Dots investigadores, auditores y de mejora; los tutores por área; la instrucción maestra visual; los comandos didácticos (`/worksheet` `/escape` `/detective` `/boardgame` `/stations` `/manipulative` `/comic` `/lapbook` `/puzzle` `/minibook` y demás) y los comandos de pensamiento (`/ultrathink` `/stepback` `/firstprinciples` … `/selfcheck`).

Los agentes de esta app están en `AGENTES-IA.md`; respétalos y mantenlos coherentes con la gobernanza común.

## No negociables
1. Que las personas verdaderamente aprendan: producir el recurso (no describirlo), interpretarlo, aplicarlo y comprobar la comprensión.
2. Currículo MEN (EBC y DBA con número y redacción oficial; si no se verifica, se dice) y áreas SABI (matemática y estadística financiera, inteligencia emocional, inglés, STEAM, SENA).
3. Evidencia revisada por pares con DOI verificado; nada de neuromitos; nunca inventar datos ni referencias.
4. Seguridad infantil y privacidad (Ley 1581 de 2012): nadie ve datos de otros; nada personal en archivos públicos.
5. Pedagogía del error: «El error no nos detiene: nos enseña, nos fortalece y nos hace crecer».
6. Identidad: azul #1A2D7A, naranja #F47C20, dorado #F5C518; español de Colombia claro, sin juicio.
7. Todo contenido nuevo queda «en revisión» hasta que lo apruebe el docente o el equipo responsable.

## Antes de publicar
- No romper lo que funciona: probar en navegador, en computador y en celular, sin errores de JavaScript.
- Aplicar `/factcheck` y `/selfcheck`, y que un Dot auditor distinto de quien creó el contenido lo revise.
- Commit en español que diga qué cambió; Cloudflare despliega desde GitHub. Verificar que el despliegue terminó.

## Propiedad y protección (no quitar)
- Titulares: **SABI CENTEC — Alexander Rojas Zamorano, Paula Andrea Rojas Cairasco y Daniela Rojas Cairasco**. Licencia propietaria en `LICENSE` (todos los derechos reservados, no es código abierto).
- Cada HTML servido lleva: comentario de derechos tras `<!doctype html>`, metas `author`/`copyright`/`rights`/`robots noai`, JSON-LD con `copyrightHolder` y `author` (los tres titulares y SABI CENTEC) y el pie «© 2025-2026 SABI CENTEC · … · Todos los derechos reservados · Prohibida su copia o reproducción». Toda página nueva debe llevarlos.
- `assets/sabi-proteccion.js` (cargado en el `<head>` de las páginas públicas): bloquea marcos ajenos, muestra «Copia no autorizada» fuera de *.sabicentec.com, protege imágenes, desactiva Ctrl+S/Ctrl+U y agrega la fuente a textos largos copiados. Es solo disuasivo: la protección real es el aviso legal + el registro ante la DNDA + el repositorio privado.
- `_headers` (cabeceras de Cloudflare: nosniff, `frame-ancestors`, `X-Robots-Tag: noai`) y `robots.txt` (bloquea bots de IA y copiadores). No agregar una CSP completa de recursos: la app usa APIs y CDN externos.
