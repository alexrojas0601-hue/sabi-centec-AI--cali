/*!
 * SABI DOTS · Red de tutores especialistas y comandos didácticos de AI CENTEC
 * Prompt Maestro de Gobernanza, Tutoría y Arquitectura del Ecosistema SABICENTEC (§3 y §4).
 * Lo usa index.html; cualquier app SABI puede cargarlo: <script src="https://ai.sabicentec.com/sabi-dots.js"></script>
 * Expone window.SabiDots = { DOTS, COMANDOS, elegirDot(texto), elegirComando(texto), enlacesInvestigacion(...) }
 */
(function () {
  var sinTildes = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };

  // Los 8 Dots tutores. "area" es la clave que entienden el resto de apps SABI.
  var DOTS = {
    Dot_Matematicas_Estrategica: { nombre: 'Matemáticas Estratégica', area: 'matematicas', color: '#064FAE', lema: 'Matemáticas, matemática y estadística financiera' },
    Dot_LecturaCritica_Lenguaje: { nombre: 'Lectura Crítica y Lenguaje', area: 'lenguaje', color: '#7A5AC8', lema: 'Leer, inferir, argumentar y escribir' },
    Dot_CienciasNaturales_STEAM: { nombre: 'Ciencias Naturales STEAM', area: 'ciencias', color: '#108A4F', lema: 'Observar, experimentar, modelar y crear' },
    Dot_CienciasSociales_Ciudadanas: { nombre: 'Sociales y Ciudadanas', area: 'sociales', color: '#B45309', lema: 'Contexto, perspectivas y ciudadanía' },
    Dot_Bilinguismo_Ingles: { nombre: 'Bilingüismo Inglés', area: 'ingles', color: '#0F766E', lema: 'English for real life · B2/C1' },
    Dot_InteligenciaEmocional_Valores: { nombre: 'Inteligencia Emocional y Valores', area: 'bienestar', color: '#C2410C', lema: 'Sentir, pensar y actuar con autoliderazgo' },
    Dot_Tecnico_SENA: { nombre: 'Técnico SENA', area: 'tecnico', color: '#4B5563', lema: 'Oficio, empleabilidad y emprendimiento' },
    Dot_EducacionDigital_IA: { nombre: 'Educación Digital e IA', area: 'tecnologia', color: '#1A2D7A', lema: 'Programar, crear y usar la IA con ética' }
  };

  // Palabras clave (raíces sin tildes) — la misma tabla que usa el servidor /api/institucional.
  var CLAVES = {
    Dot_Matematicas_Estrategica: ['matemat', 'algebra', 'aritmet', 'geometr', 'fraccion', 'decimal', 'ecuacion', 'inecuacion', 'funcion lineal', 'funcion cuadratica', 'funciones', 'polinom', 'derivad', 'integral', 'limite', 'trigonom', 'seno', 'coseno', 'teorema', 'pitagoras', 'porcentaje', 'proporcion', 'regla de tres', 'estadist', 'probabil', 'media', 'mediana', 'desviacion', 'grafica', 'interes', 'ahorro', 'presupuesto', 'inversion', 'credito', 'deuda', 'tasa', 'financ', 'dinero', 'precio', 'inflacion', 'multiplic', 'divis', 'suma', 'resta', 'numero', 'area de', 'perimetro', 'volumen'],
    Dot_LecturaCritica_Lenguaje: ['lectura', 'texto', 'comprension', 'gramatica', 'ortografia', 'literatura', 'novela', 'cuento', 'poema', 'poesia', 'escritura', 'ensayo', 'argument', 'tesis', 'resumen', 'sinonimo', 'metafora', 'figura literaria', 'redaccion', 'lenguaje', 'castellano', 'espanol', 'verbo', 'sustantivo', 'oracion', 'parrafo'],
    Dot_CienciasNaturales_STEAM: ['biolog', 'quimic', 'fisic', 'ciencia', 'celula', 'adn', 'gen', 'fotosintesis', 'ecosistema', 'especie', 'evolucion', 'atomo', 'molecula', 'elemento', 'tabla periodica', 'reaccion', 'energia', 'fuerza', 'movimiento', 'velocidad', 'newton', 'electric', 'circuito', 'magnet', 'onda', 'sonido', 'luz', 'calor', 'temperatura', 'agua', 'planeta', 'sistema solar', 'cuerpo humano', 'organo', 'sangre', 'corazon', 'virus', 'bacteria', 'experimento', 'steam', 'ingenier', 'prototipo', 'clima', 'volcan', 'contamin', 'ambient', 'rio ', 'reciclaj', 'residuo', 'salud', 'nutricion', 'enfermedad', 'vacuna', 'dinosaurio', 'animal', 'planta'],
    Dot_CienciasSociales_Ciudadanas: ['historia', 'geograf', 'constitucion', 'ciudadan', 'democracia', 'derechos', 'estado', 'gobierno', 'congreso', 'guerra', 'independencia', 'colonia', 'conquista', 'revolucion', 'sociales', 'filosof', 'econom', 'cultura', 'conflicto', 'paz', 'mapa', 'continente', 'pais', 'region', 'municipio', 'eleccion', 'voto', 'ley'],
    Dot_Bilinguismo_Ingles: ['ingles', 'english', 'grammar', 'vocabulary', 'speaking', 'listening', 'reading', 'writing', 'pronunciation', 'present perfect', 'past simple', 'verb to be', 'traduc', 'translate', 'how do i say', 'como se dice', 'phrasal'],
    Dot_InteligenciaEmocional_Valores: ['emocion', 'sentimiento', 'triste', 'ansiedad', 'ansioso', 'estres', 'miedo', 'enojo', 'rabia', 'autoestima', 'confianza', 'convivencia', 'bullying', 'acoso', 'amistad', 'valores', 'respeto', 'honestidad', 'mentira', 'resilien', 'empatia', 'liderazgo', 'bienestar', 'proyecto de vida', 'motivacion', 'felicidad', 'familia'],
    Dot_Tecnico_SENA: ['sena', 'tecnico', 'tecnologo', 'emprend', 'negocio', 'empresa', 'empleab', 'hoja de vida', 'entrevista de trabajo', 'oficio', 'contabil', 'mecanica', 'soldadura', 'cocina', 'electricista', 'mercadeo', 'ventas', 'plan de negocio'],
    Dot_EducacionDigital_IA: ['programa', 'codigo', 'python', 'javascript', 'scratch', 'html', 'informatic', 'computador', 'software', 'inteligencia artificial', 'chatgpt', 'robot', 'algoritmo', 'internet', 'digital', 'ciberseguridad', 'contrasena', 'redes sociales', 'app', 'videojuego', 'excel', 'base de datos', 'tecnologia']
  };

  function elegirDot(texto) {
    var n = ' ' + sinTildes(texto).replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ') + ' ';
    var mejor = null, puntos = 0;
    Object.keys(CLAVES).forEach(function (dot) {
      var p = CLAVES[dot].reduce(function (s, k) { return s + (n.indexOf(' ' + k + (k.length <= 4 ? ' ' : '')) >= 0 ? k.split(' ').length : 0); }, 0);
      if (p > puntos) { mejor = dot; puntos = p; }
    });
    return mejor;
  }

  // Comandos del Prompt Maestro §4 (+ investigar, proyecto y quiz). "ej" = ejemplo para el campo de texto.
  var COMANDOS = [
    { grupo: 'Investigar y crear', id: 'investigar', nombre: 'Investigar', desc: 'Guía de investigación con fuentes confiables y cita APA', ej: '¿Cómo afecta el ruido a la concentración de los estudiantes?' },
    { grupo: 'Investigar y crear', id: 'proyecto', nombre: 'Proyecto', desc: 'Formula un proyecto con ODS, objetivos SMART, presupuesto y SENA', ej: 'Huerta escolar que venda hortalizas al barrio' },
    { grupo: 'Investigar y crear', id: '5w1h', nombre: '5W1H', desc: 'Qué, quién, cuándo, dónde, por qué y cómo', ej: 'La independencia de Colombia' },
    { grupo: 'Investigar y crear', id: 'timeline', nombre: 'Línea de tiempo', desc: 'Cronología de hechos y por qué importan', ej: 'Historia de la inteligencia artificial' },
    { grupo: 'Matemáticas y finanzas', id: 'paso_a_paso', nombre: 'Paso a paso', desc: 'Sin saltarse ninguna deducción', ej: 'Si ahorro $100.000 al 1% mensual, ¿cuánto tengo en un año?' },
    { grupo: 'Matemáticas y finanzas', id: 'mathvisual', nombre: 'Math visual', desc: 'Grafica funciones, tasas y datos', ej: 'f(x) = x² − 4' },
    { grupo: 'Matemáticas y finanzas', id: 'matematicas_formulas', nombre: 'Fórmulas', desc: 'Cada símbolo explicado con su unidad', ej: 'Fórmula del interés compuesto' },
    { grupo: 'Matemáticas y finanzas', id: 'mathmaps', nombre: 'Math maps', desc: 'Mapa mental de fórmulas y teoremas', ej: 'Trigonometría' },
    { grupo: 'Matemáticas y finanzas', id: 'matflow', nombre: 'Mat flow', desc: 'Algoritmo de resolución en diagrama de flujo', ej: 'Resolver una ecuación de segundo grado' },
    { grupo: 'Matemáticas y finanzas', id: 'detectaerror', nombre: 'Detecta el error', desc: 'Encuentra y corrige el fallo de un ejercicio', ej: 'Suma de fracciones' },
    { grupo: 'Aprender jugando', id: 'flashcards', nombre: 'Flashcards', desc: 'Tarjetas con repetición espaciada', ej: 'La célula y sus organelos' },
    { grupo: 'Aprender jugando', id: 'quiz', nombre: 'Quiz Saber 11', desc: '5 preguntas con retroalimentación', ej: 'Lectura crítica: argumentos' },
    { grupo: 'Aprender jugando', id: 'crucigrama', nombre: 'Crucigrama', desc: 'Pistas de razonamiento y concepto', ej: 'Sistema solar' },
    { grupo: 'Aprender jugando', id: 'sopa_de_letras', nombre: 'Sopa de letras', desc: 'Términos clave del tema', ej: 'Ecosistemas' },
    { grupo: 'Aprender jugando', id: 'comics', nombre: 'Cómic', desc: 'Historieta para entender o reflexionar', ej: 'Decir la verdad aunque cueste' },
    { grupo: 'Ver para entender', id: 'fluxograma', nombre: 'Fluxograma', desc: 'Procesos y decisiones como una historia', ej: 'Cómo se forma la lluvia' },
    { grupo: 'Ver para entender', id: 'mapmaps', nombre: 'Mapa mental', desc: 'Ideas conectadas con otras áreas', ej: 'El agua' },
    { grupo: 'Ver para entender', id: 'sketchnotes', nombre: 'Sketchnotes', desc: 'Apuntes visuales condensados', ej: 'La Revolución Industrial' },
    { grupo: 'Ver para entender', id: 'human_atlas', nombre: 'Atlas humano', desc: 'Anatomía y funciones del cuerpo', ej: 'El sistema digestivo' }
  ];
  var ALIAS = { crossword: 'crucigrama', 'step-by-step': 'paso_a_paso', comic: 'comics', investigacion: 'investigar', proyectos: 'proyecto', linea_de_tiempo: 'timeline', mapa: 'mapmaps' };

  function elegirComando(texto) {
    var m = String(texto || '').trim().match(/^\/([a-z0-9_\-]+)/i);
    if (!m) return null;
    var c = sinTildes(m[1]); c = ALIAS[c] || c;
    return COMANDOS.some(function (x) { return x.id === c; }) ? c : null;
  }
  function quitarComando(texto) { return String(texto || '').replace(/^\s*\/[a-z0-9_\-]+\s*/i, '').trim(); }

  // Enlaces de búsqueda en fuentes confiables (los arma la app; la IA nunca inventa URL).
  function enlacesInvestigacion(palabras, palabrasEn) {
    var es = (palabras || []).join(' '), en = (palabrasEn || palabras || []).join(' ');
    var q = encodeURIComponent;
    return [
      { nombre: 'Google Académico', tipo: 'Artículos científicos', url: 'https://scholar.google.com/scholar?hl=es&q=' + q(es) },
      { nombre: 'SciELO', tipo: 'Revistas científicas de Iberoamérica', url: 'https://search.scielo.org/?lang=es&q=' + q(es) },
      { nombre: 'Redalyc', tipo: 'Revistas de acceso abierto', url: 'https://www.redalyc.org/busquedaArticuloFiltros.oa?q=' + q(es) },
      { nombre: 'DANE', tipo: 'Datos oficiales de Colombia', url: 'https://www.dane.gov.co/index.php/buscador?searchword=' + q(es) },
      { nombre: 'Biblioteca Nacional de Colombia', tipo: 'Libros y archivo', url: 'https://bibliotecanacional.gov.co/es-co/resultados-busqueda?q=' + q(es) },
      { nombre: 'Wikipedia (para empezar, no para citar)', tipo: 'Panorama general', url: 'https://es.wikipedia.org/w/index.php?search=' + q(es) },
      { nombre: 'Google Scholar (inglés)', tipo: 'Investigación internacional', url: 'https://scholar.google.com/scholar?hl=en&q=' + q(en) }
    ];
  }

  window.SabiDots = { DOTS: DOTS, COMANDOS: COMANDOS, elegirDot: elegirDot, elegirComando: elegirComando, quitarComando: quitarComando, enlacesInvestigacion: enlacesInvestigacion, sinTildes: sinTildes };
})();
