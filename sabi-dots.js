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
  var C = function (grupo, id, nombre, desc, ej) { return { grupo: grupo, id: id, nombre: nombre, desc: desc, ej: ej }; };
  var G1 = 'Ciencia con experimentos', G2 = 'Fichas de matemáticas', G3 = 'Lectura: comprender, relacionar y pensar',
      G4 = 'Ayudas didácticas y juegos', G5 = 'Investigar y crear', G6 = 'Ver para entender',
      G7 = 'Piensa mejor (pensamiento profundo)', G8 = 'Escribe, decide y planea (docentes y directivos)';
  var COMANDOS = [
    C(G1, 'experimento', 'Experimento', 'Predice, observa y explica, con materiales caseros y seguros', 'Por qué flotan algunos objetos (3°)'),
    C(G2, 'ficha', 'Ficha a medida', 'Idea clave + práctica infinita con clave de respuestas', 'Sumas llevando para 2°'),
    C(G2, 'calculo', 'Cálculo', 'Operaciones del grado, infinitas', 'Tablas de multiplicar del 6 al 9'),
    C(G2, 'problemas', 'Problemas cotidianos', 'Situaciones reales de Cali', 'Problemas de división para 4°'),
    C(G2, 'series', 'Series y patrones', 'Encuentra la regla y predice', 'Patrones para 1°'),
    C(G2, 'geometria', 'Geometría visual', 'Figuras dibujadas, perímetro, área, ángulos', 'Área de rectángulos para 5°'),
    C(G2, 'dinero', 'Dinero y cambio', 'Pesos colombianos, compras y vueltas', 'Dar vueltas en la tienda para 3°'),
    C(G2, 'encuentra_el_error', 'Encuentra el error', 'Revisa procedimientos y corrige', 'Restas con préstamo'),
    C(G2, 'paso_a_paso', 'Paso a paso', 'Sin saltarse ninguna deducción', 'Si ahorro $100.000 al 1% mensual, ¿cuánto tengo en un año?'),
    C(G2, 'mathvisual', 'Math visual', 'Grafica funciones, tasas y datos', 'f(x) = x² − 4'),
    C(G2, 'matematicas_formulas', 'Fórmulas', 'Cada símbolo explicado con su unidad', 'Fórmula del interés compuesto'),
    C(G2, 'mathmaps', 'Math maps', 'Mapa mental de fórmulas y teoremas', 'Trigonometría'),
    C(G2, 'matflow', 'Mat flow', 'Algoritmo de resolución en diagrama', 'Resolver una ecuación de segundo grado'),
    C(G2, 'detectaerror', 'Detecta el error (IA)', 'Un ejercicio resuelto con un error escondido', 'Suma de fracciones'),
    C(G3, 'lectura', 'Lectura completa', 'Los 6 niveles sobre un texto del grado o el tuyo', 'Un cuento sobre el río Pance para 3°'),
    C(G3, 'lo_que_dice_el_texto', 'Lo que dice el texto', '4 preguntas literales: encuentra la oración exacta', 'Texto sobre los colibríes'),
    C(G3, 'leer_entre_lineas', 'Leer entre líneas', 'Inferencias con pistas del texto', 'Fábula de la hormiga y la cigarra'),
    C(G3, 'palabras_en_contexto', 'Palabras en contexto', 'Significado según la oración', 'Noticia sobre la Feria de Cali'),
    C(G3, 'donde_lo_pone', '¿Dónde lo pone?', 'Localiza la información en el párrafo', 'Texto sobre el agua'),
    C(G3, 'orden_y_causas', 'Orden y causas', 'Secuencia de hechos y causa-efecto', 'Historia de la independencia'),
    C(G3, 'piensa_y_argumenta', 'Piensa y argumenta', 'Opina y sustenta con el texto', 'Artículo sobre el uso del celular'),
    C(G4, 'worksheet', 'Worksheet', 'Hoja de trabajo imprimible con clave', 'Sustantivos y adjetivos para 2°'),
    C(G4, 'escape', 'Escape room', 'Abre candados resolviendo retos del tema', 'Fracciones para 4°'),
    C(G4, 'detective', 'Detective', 'Resuelve un caso con pistas y el concepto', 'Estados de la materia'),
    C(G4, 'boardgame', 'Juego de mesa', 'Tablero con dado, fichas y preguntas', 'Tablas de multiplicar'),
    C(G4, 'stations', 'Estaciones', 'Rotación por estaciones con temporizador', 'El ciclo del agua'),
    C(G4, 'manipulative', 'Material manipulativo', 'Plantillas para recortar: fracciones, reloj, recta, tangram…', 'Fracciones equivalentes'),
    C(G4, 'comics', 'Cómic', 'Historieta para entender o reflexionar', 'Decir la verdad aunque cueste'),
    C(G4, 'lapbook', 'Lapbook', 'Solapas para recortar y pegar', 'Los planetas'),
    C(G4, 'puzzle', 'Puzzle', 'Parejas, ordenar o clasificar', 'Animales vertebrados e invertebrados'),
    C(G4, 'minibook', 'Minilibro', 'Librito de 8 páginas en una hoja', 'Las partes de la planta'),
    C(G4, 'flashcards', 'Flashcards', 'Tarjetas con repetición espaciada', 'La célula y sus organelos'),
    C(G4, 'quiz', 'Quiz Saber 11', '5 preguntas con retroalimentación', 'Lectura crítica: argumentos'),
    C(G4, 'crucigrama', 'Crucigrama', 'Pistas de razonamiento y concepto', 'Sistema solar'),
    C(G4, 'sopa_de_letras', 'Sopa de letras', 'Términos clave del tema', 'Ecosistemas'),
    C(G5, 'investigar', 'Investigar', 'Búsqueda web en vivo, fuentes y cita APA', '¿Cómo afecta el ruido a la concentración?'),
    C(G5, 'proyecto', 'Proyecto', 'ODS, objetivos SMART, presupuesto y SENA', 'Huerta escolar que venda al barrio'),
    C(G5, '5w1h', '5W1H', 'Qué, quién, cuándo, dónde, por qué y cómo', 'La independencia de Colombia'),
    C(G5, 'timeline', 'Línea de tiempo', 'Cronología o plan con hitos', 'Historia de la inteligencia artificial'),
    C(G5, 'factcheck', 'Verificar datos', 'Comprueba afirmaciones en la web', '¿Es cierto que solo usamos el 10 % del cerebro?'),
    C(G5, 'citesources', 'Con fuentes', 'Cada dato con su fuente y fecha', 'Biodiversidad del Valle del Cauca'),
    C(G5, 'summarizeresearch', 'Resumir investigación', 'Lo más reciente y confiable', 'Uso del celular y aprendizaje'),
    C(G5, 'trendcheck', 'Tendencias', 'Qué está cambiando y qué tan sólido es', 'IA en los colegios de Colombia'),
    C(G6, 'fluxograma', 'Fluxograma', 'Procesos y decisiones como una historia', 'Cómo se forma la lluvia'),
    C(G6, 'mapmaps', 'Mapa mental', 'Ideas conectadas con otras áreas', 'El agua'),
    C(G6, 'sketchnotes', 'Sketchnotes', 'Apuntes visuales condensados', 'La Revolución Industrial'),
    C(G6, 'human_atlas', 'Atlas humano', 'Anatomía y funciones del cuerpo', 'El sistema digestivo'),
    C(G7, 'ultrathink', 'Ultrathink', 'Pensamiento profundo antes de responder', '¿Por qué el cielo es azul?'),
    C(G7, 'stepback', 'Step back', 'La pregunta de fondo y el principio general', 'Mi hijo no quiere hacer tareas'),
    C(G7, 'firstprinciples', 'Primeros principios', 'Reconstruir desde verdades fundamentales', '¿Por qué un avión vuela?'),
    C(G7, 'chainofthought', 'Cadena de razonamiento', 'Razonamiento visible paso a paso', 'Un problema de lógica'),
    C(G7, 'eli5', 'Explícalo fácil (ELI5)', 'Como a un niño de 5 años', '¿Qué es la electricidad?'),
    C(G7, 'technicaldeepdive', 'A fondo (técnico)', 'Nivel experto con fórmulas y casos límite', 'Fotosíntesis a nivel molecular'),
    C(G7, 'analogy', 'Analogías', 'Explica con comparaciones de la vida diaria', 'El sistema inmune'),
    C(G7, 'socratic', 'Socrático', 'Preguntas que te llevan a descubrirlo', '¿Por qué hay estaciones?'),
    C(G7, 'godmode', 'Máximo esfuerzo', 'Piensa, resuelve, se critica y mejora', 'Plan para subir el puntaje Saber 11'),
    C(G7, 'critique', 'Crítica', 'Fortalezas y mejoras de tu trabajo', 'Pega aquí tu ensayo'),
    C(G7, 'iterate', 'Iterar', 'Versión, autocrítica y versión mejorada', 'Un discurso de grado'),
    C(G7, 'selfcheck', 'Autoevaluación', 'SABI se califica a sí misma', 'Explica la mitosis'),
    C(G8, 'rewrite', 'Reescribir', 'Más claro, correcto y fuerte', 'Pega aquí tu texto'),
    C(G8, 'shorten', 'Acortar', 'La mitad, sin perder lo esencial', 'Pega aquí tu texto'),
    C(G8, 'expand', 'Ampliar', 'Más ejemplos y argumentos', 'Pega aquí tu texto'),
    C(G8, 'outline', 'Esquema', 'Estructura jerárquica lista para desarrollar', 'Plan de área de ciencias'),
    C(G8, 'formalize', 'Formal', 'Tono institucional', 'Pega aquí tu mensaje'),
    C(G8, 'casualize', 'Cercano', 'Tono cálido y sencillo', 'Pega aquí tu mensaje'),
    C(G8, 'persuade', 'Persuadir', 'Mensaje ético basado en evidencia', 'Invitar a las familias a la escuela de padres'),
    C(G8, 'deescalate', 'Bajar la tensión', 'Responder a un conflicto con respeto', 'Una queja de un acudiente'),
    C(G8, 'procons', 'Pros y contras', 'Con peso y recomendación', '¿Uniforme de educación física nuevo?'),
    C(G8, 'swot', 'FODA', 'Fortalezas, oportunidades, debilidades y amenazas', 'Abrir jornada de la tarde'),
    C(G8, 'riskcheck', 'Riesgos', 'Probabilidad, impacto y mitigación', 'Salida pedagógica a Pance'),
    C(G8, 'premortem', 'Premortem', 'Imagina el fracaso y prevénlo', 'Feria de la ciencia'),
    C(G8, 'brainstorm', 'Lluvia de ideas', '12 a 20 ideas y las 3 mejores', 'Celebrar el día del idioma'),
    C(G8, 'remix', 'Remix', 'Combina con otras áreas', 'Clase de fracciones con música'),
    C(G8, 'whatif', '¿Qué pasaría si…?', 'Escenarios y consecuencias', 'Si no existiera internet'),
    C(G8, 'metaphor', 'Metáforas', 'Para explicar o comunicar', 'El aprendizaje'),
    C(G8, 'prd', 'PRD', 'Documento de requisitos de un proyecto', 'App de tareas para familias'),
    C(G8, 'okrs', 'OKR', 'Objetivos y resultados clave medibles', 'Mejorar lectura crítica en 9°'),
    C(G8, 'plan_timeline', 'Plan con hitos', 'Cronograma de un plan', 'Preparación Saber 11 en 12 semanas'),
    C(G8, 'delegate', 'Delegar', 'Tareas, responsables y verificación', 'Organizar el día de la familia'),
    C(G8, 'codereview', 'Revisar código', 'Errores, seguridad y buenas prácticas', 'Pega aquí tu código'),
    C(G8, 'debug', 'Depurar', 'Causa raíz y corrección', 'Pega aquí tu código y el error'),
    C(G8, 'refactor', 'Refactorizar', 'Más claro sin cambiar lo que hace', 'Pega aquí tu código'),
    C(G8, 'testcases', 'Casos de prueba', 'Normales, límite y de error', 'Función que calcula el promedio')
  ];
  var ALIAS = {
    crossword: 'crucigrama', 'step-by-step': 'paso_a_paso', comic: 'comics', investigacion: 'investigar', proyectos: 'proyecto',
    linea_de_tiempo: 'timeline', mapa: 'mapmaps', experimentos: 'experimento', laboratorio: 'experimento', fichas: 'ficha',
    worksheets: 'worksheet', estaciones: 'stations', manipulativo: 'manipulative', rompecabezas: 'puzzle',
    error: 'encuentra_el_error', encuentraelerror: 'encuentra_el_error', lectura_comprensiva: 'lectura',
    firstprincipies: 'firstprinciples', primeros_principios: 'firstprinciples', tecchnicaldeepdive: 'technicaldeepdive',
    outine: 'outline', codereviwe: 'codereview', brinstorm: 'brainstorm', lluvia_de_ideas: 'brainstorm', casualiza: 'casualize',
    '7prd': 'prd', summarizereseearrch: 'summarizeresearch', tredcheck: 'trendcheck', foda: 'swot', proscons: 'procons',
    pros_contras: 'procons', socratico: 'socratic', analogia: 'analogy', autoevaluacion: 'selfcheck'
  };

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
