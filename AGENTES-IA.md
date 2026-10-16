# AI CENTEC (sabicentec.com) — Arquitectura de Dots, herramientas y agentes

Versión 4 · 15 de octubre de 2026 · Aplica el **Prompt Maestro de Gobernanza, Tutoría y Arquitectura del
Ecosistema SABICENTEC** y la **Instrucción Maestra para una Educación Visual, Profunda, Clara y Aplicada**.

## Cómo responde una pregunta

```
Estudiante / docente / familia
        │  escribe una pregunta (y opcionalmente elige una herramienta: /investigar, /flashcards…)
        ▼
sabicentec.com (este repositorio)
  · sabi-dots.js     → elige el Dot tutor del área y el comando
  · datos en vivo    → /api/actualidad (clima y noticias), /api/comofunciona (Wikipedia)
        │
        ▼
superacion.sabicentec.com/api/institucional (repo sabicentecsuperacion)
  1. Dot tutor del área (Maestro): secuencia de aprendizaje significativo + recursos visuales
  2. Dot_Auditor_Riguroso: resuelve por su cuenta, verifica 8 criterios y corrige antes de publicar
  · lee la pedagogía vigente aprobada por coordinación (data/pedagogia-vigente.json)
        │
        ▼
sabicentec.com · sabi-recursos.js convierte los bloques ```sabi``` y ```mermaid``` en recursos
interactivos; la microclase cierra con "Demuestra que aprendiste" y "Tu siguiente paso".
```

## Red de Dots tutores (Prompt Maestro §3.B)

| Dot | Cubre |
|---|---|
| Dot_Matematicas_Estrategica | Matemáticas, matemática financiera y estadística financiera |
| Dot_LecturaCritica_Lenguaje | Lectura crítica (literal, inferencial, crítica), escritura, literatura |
| Dot_CienciasNaturales_STEAM | Biología, química, física, ambiente y proyectos STEAM |
| Dot_CienciasSociales_Ciudadanas | Historia, geografía, Constitución, ciudadanía, economía, filosofía |
| Dot_Bilinguismo_Ingles | Inglés con meta B2/C1 |
| Dot_InteligenciaEmocional_Valores | Emociones, autoliderazgo, convivencia, valores |
| Dot_Tecnico_SENA | Especialidades técnicas, empleabilidad y emprendimiento |
| Dot_EducacionDigital_IA | Programación, ciudadanía digital e inteligencia artificial |

## Herramientas (comandos del Prompt Maestro §4)

Se eligen en «Herramientas de aprendizaje» o escribiendo el comando al inicio: `/investigar`, `/proyecto`,
`/5w1h`, `/timeline`, `/paso_a_paso`, `/mathvisual`, `/matematicas_formulas`, `/mathmaps`, `/matflow`,
`/detectaerror`, `/flashcards`, `/quiz`, `/crucigrama`, `/sopa_de_letras`, `/comics`, `/fluxograma`,
`/mapmaps`, `/sketchnotes`, `/human_atlas`. Atajos: `/crossword`, `/step-by-step`.
Enlace directo a una herramienta: `https://sabicentec.com/?cmd=investigar&q=tu pregunta`.

| Recurso que dibuja la app | Qué permite |
|---|---|
| Gráfica | Funciones y datos con lectura de valores al pasar el dedo; descarga como imagen |
| Diagramas (mermaid) | Flujos, mapas mentales y algoritmos |
| Paso a paso / Detecta el error | Cada deducción; reto de encontrar el paso equivocado |
| Flashcards + **Mis repasos** | Repetición espaciada (1, 3, 7, 16 y 35 días), guardada en el dispositivo |
| Quiz Saber 11 | Retroalimentación inmediata y puntaje |
| Crucigrama y sopa de letras | Generados a partir de los conceptos de la respuesta |
| Línea de tiempo, 5W1H, sketchnotes, cómic | Organizar, sintetizar y narrar |
| Modo investigador | Pregunta, palabras clave, enlaces a Google Académico, SciELO, Redalyc, DANE y Biblioteca Nacional, prueba CRAAP y generador de cita APA 7 (la IA nunca inventa URL) |
| Proyecto | Las 7 secciones del §5 con presupuesto en COP y cronograma |
| Síntesis | Qué memorizar, comprender, saber hacer y saber decidir + plan de repaso |

## Agentes permanentes (GitHub Actions)

| Agente | Dónde | Cuándo | Qué hace |
|---|---|---|---|
| **Dot Vigía** | este repo · `dot-vigia.yml` | diario 6:15 a. m. y en cada cambio | Revisa sintaxis, motor de gráficas, crucigramas, enrutador de Dots y servicios en vivo; si algo falla abre un Issue |
| **Dot_Investigador_SextoSentido** | sabicentecsuperacion · `sabi-sextosentido.yml` | viernes 6:00 a. m. | Investiga en la web tendencias de educación, tecnología y trabajo a 30-50 años; el Dot_Auditor_Riguroso verifica fuente, fecha y enlace; PR → «Radar del futuro» |
| Auditor institucional | sabicentecsuperacion · `sabi-auditor-institucional.yml` | miércoles | Examina la IA con 17 preguntas (incluye matemática financiera, comandos y recursos) y califica 6 criterios + validez de los bloques |
| Investigadores por área | sabicentecsuperacion · `sabi-investigadores.yml` | martes y jueves | Pedagogía vigente y banco de proyectos (la IA institucional la aplica desde el siguiente turno) |
| Curador STEAM | sabicentecsuperacion · `sabi-curador.yml` | lunes y día 1 | Retos de la semana |

Nada que proponga un agente investigador se publica sin **Merge** de coordinación académica.

## Archivos de este repositorio

- `index.html` — la app (pregunta, respuesta, microclase, retos, repasos, radar).
- `sabi-dots.js` — Dots, comandos y enlaces de investigación (otras apps SABI pueden cargarlo).
- `sabi-recursos.js` — renderizadores de recursos visuales e interactivos.
- `sabi-vivo.js` — widget «En vivo · ¿Cómo funciona?» para todas las apps SABI.
- `functions/api/` — datos en vivo de Cali y «¿Cómo funciona?».
- `manifest.webmanifest`, `sw.js`, `assets/icon-*.png` — app instalable en el celular.
- `scripts/dot-vigia.mjs` — el Dot Vigía.
