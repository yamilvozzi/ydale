import { AFINACION, CANTIDAD_TRASTES, NOTAS, notaEnTraste } from './escalas.js'
import { crearAcorde } from './notasConAcordes.js'
import { FORMULAS_ACORDES } from './formulasAcordes.js'

const NATURALES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const LETRAS = Object.keys(NATURALES)
const MIDI_AL_AIRE = [64, 59, 55, 50, 45, 40]
export const ZONAS = { ABIERTA: [0, 4], MEDIA: [5, 9], AGUDA: [10, CANTIDAD_TRASTES], TODAS: [0, CANTIDAD_TRASTES] }
export const GRUPOS_CUERDAS = { '1–2–3': [0, 1, 2], '2–3–4': [1, 2, 3], '3–4–5': [2, 3, 4], '4–5–6': [3, 4, 5] }
export const GRUPOS_CUERDAS_4 = { '1–2–3–4': [0, 1, 2, 3], '2–3–4–5': [1, 2, 3, 4], '3–4–5–6': [2, 3, 4, 5] }
const modulo = (n) => (n + 120) % 12

function interpretarNota(texto) {
  const nombre = texto[0].toUpperCase() + texto.slice(1)
  return { nombre, clase: modulo(NATURALES[nombre[0]] + (nombre[1] === '#' ? 1 : nombre[1] === 'b' ? -1 : 0)) }
}

export function interpretarAcorde(texto) {
  if (typeof texto !== 'string') return null
  const partes = texto.trim().replaceAll('♯', '#').replaceAll('♭', 'b')
    .match(/^([A-Ga-g][#b]?)([^/]*)(?:\/([A-Ga-g][#b]?))?$/)
  if (!partes) return null
  const raiz = interpretarNota(partes[1])
  const calidad = partes[2] ?? ''
  if (!Object.hasOwn(FORMULAS_ACORDES, calidad)) return null
  const formula = FORMULAS_ACORDES[calidad]
  const bajo = partes[3] ? interpretarNota(partes[3]) : null
  const notas = formula.grados.map(([intervalo, grado]) => {
    const clase = modulo(raiz.clase + intervalo)
    const letra = LETRAS[(LETRAS.indexOf(raiz.nombre[0]) + grado) % 7]
    const diferencia = modulo(clase - NATURALES[letra] + 6) - 6
    const esencial = formula.esenciales.includes(intervalo)
    const prioridad = esencial ? 100 : (formula.prioridades[intervalo] ?? (intervalo === 0 ? 80 : intervalo === 7 ? 10 : intervalo === 17 ? 20 : 40))
    return { clase, nombre: letra + (diferencia < 0 ? 'b'.repeat(-diferencia) : '#'.repeat(diferencia)), intervalo, grado, esencial, prioridad }
  })
  return {
    nombre: raiz.nombre + calidad + (bajo ? `/${bajo.nombre}` : ''), raiz, calidad, bajo, notas,
    voces: notas.filter(nota => nota.esencial || (formula.esenciales.length < 3 && nota.intervalo === 0)),
  }
}

function extension(notas) {
  const trastes = notas.map(({ traste }) => traste)
  return trastes.length ? Math.max(...trastes) - Math.min(...trastes) : 0
}

function posicionesEnCuerda(cuerda, notas, desde, hasta, raiz) {
  const posiciones = []
  for (let traste = desde; traste <= hasta; traste++) {
    // Exactamente la misma afinación y cálculo cromático que ESCALAS.
    const clase = NOTAS.indexOf(notaEnTraste(AFINACION[cuerda], traste))
    const nota = notas.find((actual) => actual.clase === clase)
    if (nota) posiciones.push({ cuerda, traste, clase, nota: nota.nombre, midi: MIDI_AL_AIRE[cuerda] + traste, esTonica: clase === raiz.clase })
  }
  return posiciones
}

function comparar(a, b) {
  for (let i = 0; i < a.ranking.length; i++) {
    if (a.ranking[i] !== b.ranking[i]) return a.ranking[i] - b.ranking[i]
  }
  return a.id.localeCompare(b.id)
}

// Las notas esenciales vienen de la fórmula: guías, alteraciones y extensión
// principal. Las voces restantes completan la identidad sin exigir la raíz.
function representaAcorde(acorde, principal) {
  const clases = new Set(principal.map(({ clase }) => clase))
  const requeridas = acorde.notas.filter(nota => nota.esencial)
  return clases.size >= 3 && requeridas.every(({ clase }) => clases.has(clase))
}

function notasOmitidas(acorde, principal) {
  const clases = new Set(principal.map(nota => nota.clase))
  return acorde.notas.filter(nota => !clases.has(nota.clase))
}

function perdidaMusical(acorde, principal) {
  return notasOmitidas(acorde, principal).reduce((total, nota) => total + nota.prioridad, 0)
}

/** Mínimo de dedos incluyendo cejillas posibles, sin tapar cuerdas al aire
 * ni cuerdas que deberían quedar muteadas. Máximo seis notas: DP acotada. */
export function dedosNecesarios(notas) {
  const pisadas = notas.filter(nota => nota.traste > 0)
  const coberturas = pisadas.map((_, i) => 1 << i)
  for (let i = 0; i < pisadas.length; i++) for (let j = i + 1; j < pisadas.length; j++) {
    const a = pisadas[i], b = pisadas[j]
    if (a.traste !== b.traste) continue
    const desde = Math.min(a.cuerda, b.cuerda), hasta = Math.max(a.cuerda, b.cuerda)
    let posible = true
    for (let cuerda = desde; cuerda <= hasta; cuerda++) {
      const actual = notas.find(nota => nota.cuerda === cuerda)
      if (!actual || actual.traste < a.traste) { posible = false; break }
    }
    if (posible) coberturas.push(pisadas.reduce((mask, nota, indice) =>
      nota.traste === a.traste && nota.cuerda >= desde && nota.cuerda <= hasta ? mask | (1 << indice) : mask, 0))
  }
  const limite = 1 << pisadas.length
  const dedos = Array(limite).fill(Infinity)
  dedos[0] = 0
  for (let mask = 0; mask < limite; mask++) for (const cobertura of coberturas) {
    const siguiente = mask | cobertura
    dedos[siguiente] = Math.min(dedos[siguiente], dedos[mask] + 1)
  }
  return dedos.at(-1)
}

// Referencias de 6ª a 1ª cuerda; null conserva la cuerda muteada.
// Sólo reconocen candidatos existentes, nunca generan ni excluyen posiciones.
const FORMAS_CONOCIDAS = {
  '': [[0, 2, 2, 1, 0, 0], [null, 0, 2, 2, 2, 0], [null, 3, 2, 0, 1, 0], [3, 2, 0, 0, 0, 3], [null, null, 0, 2, 3, 2]],
  m: [[0, 2, 2, 0, 0, 0], [null, 0, 2, 2, 1, 0], [null, null, 0, 2, 3, 1]],
  '7': [[0, 2, 0, 1, 0, 0], [null, 0, 2, 0, 2, 0], [null, 3, 2, 3, 1, 0], [null, null, 0, 2, 1, 2]],
  m7: [[0, 2, 0, 0, 0, 0], [null, 0, 2, 0, 1, 0], [null, null, 0, 2, 1, 1]],
  maj7: [[0, 2, 1, 1, 0, 0], [null, 0, 2, 1, 2, 0], [null, 3, 2, 0, 0, 0], [null, null, 0, 2, 2, 2]],
}

function bonusFormaConocida(acorde, principal, completo) {
  let abierta = false
  const indice = (FORMAS_CONOCIDAS[acorde.calidad] ?? []).findIndex(forma => {
    if (completo && principal.length !== forma.filter(n => n !== null).length) return false
    const referencia = forma[5 - principal[0].cuerda]
    if (referencia === null) return false
    const traslado = principal[0].traste - referencia
    // También reconoce fragmentos sobre las cuerdas elegidas. La fórmula
    // ya validó sus grados: no agrega notas ni excepciones por tonalidad.
    const coincide = traslado >= 0 && principal.every(({ cuerda, traste }) =>
      forma[5 - cuerda] !== null && traste === forma[5 - cuerda] + traslado)
    if (coincide) abierta = traslado === 0 && principal.some(n => n.traste === 0)
    return coincide
  })
  // Las cejillas E/A son más habituales y cómodas que trasladar C/G/D.
  return indice < 0 ? 0 : abierta ? -3 : indice < 2 ? -2 : -1
}

export function evaluarDigitacion(notas) {
  const pisadas = notas.filter(n => n.traste > 0).sort((a, b) => a.cuerda - b.cuerda)
  const ancla = pisadas.length ? Math.min(...pisadas.map(n => n.traste)) : 0
  // El generador conserva su ventana de búsqueda; la evaluación física
  // distingue las cuerdas al aire, que no consumen dedos ni estiramiento.
  const amplitud = extension(pisadas)
  const dedos = dedosNecesarios(notas)
  const estiramiento = pisadas.slice(1).reduce((total, nota, i) => total +
    Math.max(0, Math.abs(nota.traste - pisadas[i].traste) - 1) ** 2 / (nota.cuerda - pisadas[i].cuerda), 0)
  const huecos = Math.max(...notas.map(n => n.cuerda)) - Math.min(...notas.map(n => n.cuerda)) + 1 - notas.length
  // Los trastes se acercan físicamente al subir por el diapasón. Las
  // cejillas ya cuentan como un dedo cuando no tapan aire ni muteadas.
  const dificultad = (amplitud ** 2 + estiramiento) * 2 ** (-ancla / 12) + dedos * 2 + huecos * 2
  return { ancla, dedos, amplitud, estiramiento, dificultad, compleja: amplitud >= 4 || dedos > 4 }
}

function evaluarPropuesta(acorde, notas, zona, completo = false) {
  const [desde, hasta] = ZONAS[zona]
  const fisica = evaluarDigitacion(notas)
  const omitidas = notasOmitidas(acorde, notas)
  const distancia = Math.max(...notas.map(({ traste }) => Math.max(0, desde - traste, traste - hasta)))
  const conocida = bonusFormaConocida(acorde, notas, completo)
  return {
    ...fisica, omisiones: omitidas, distancia,
    ranking: [omitidas.length, distancia, Number(fisica.compleja), perdidaMusical(acorde, notas),
      completo ? conocida : 0, completo ? -notas.length : 0,
      fisica.dificultad + conocida * 3, fisica.ancla],
  }
}

const notasPropuesta = p => [...p.principal, ...(p.bajo ? [p.bajo] : [])]
const region = p => Math.floor(p.ancla / 3)
const omision = p => p.omisiones.map(n => n.intervalo).join(',')
const inversion = p => notasPropuesta(p).at(-1).clase
const disposicion = p => notasPropuesta(p).map(n => `${n.cuerda}:${n.clase}`).join('-')
const formaOctava = p => {
  const notas = notasPropuesta(p)
  return notas.map(n => `${n.cuerda}:${n.midi - notas.at(-1).midi}`).join('-') + `/${inversion(p)}`
}

function similares(a, b) {
  if (inversion(a) !== inversion(b) || omision(a) !== omision(b)) return false
  const notasA = notasPropuesta(a), notasB = notasPropuesta(b)
  const comunes = notasA.filter(n => notasB.some(m => m.cuerda === n.cuerda && m.traste === n.traste)).length
  return comunes >= Math.min(notasA.length, notasB.length) - 1 && Math.abs(a.ancla - b.ancla) <= 2
}

function seleccionarPropuestas(resultados) {
  if (!resultados.length) return []
  // Conservar la mayor cobertura posible; nunca sustituir grados esenciales
  // para obtener una forma más fácil. No se exige raíz en el bajo.
  const cobertura = Math.min(...resultados.map(p => p.omisiones.length))
  const unicas = new Map()
  for (const p of resultados.filter(p => p.omisiones.length === cobertura)) {
    const anterior = unicas.get(formaOctava(p))
    // La misma disposición trasladada una octava no ocupa otra opción.
    if (!anterior || p.distancia < anterior.distancia ||
      (p.distancia === anterior.distancia && p.ancla < anterior.ancla) ||
      (p.distancia === anterior.distancia && p.ancla === anterior.ancla && comparar(p, anterior) < 0)) {
      unicas.set(formaOctava(p), p)
    }
  }
  const candidatas = [...unicas.values()].sort(comparar)
  const elegidas = []
  const agregar = p => { if (p && elegidas.length < 6 && !elegidas.some(e => e.id === p.id || similares(e, p))) elegidas.push(p) }
  agregar(candidatas[0])
  // Alternativas de omisión preservan, por ejemplo, una novena sin raíz.
  // La diversidad se basa en grados, bajo real y región, no en la primera
  // cuerda que contiene una tónica (que confundía formas e inversiones).
  for (const clave of [omision, region, inversion]) {
    for (const p of candidatas) if (!elegidas.some(e => clave(e) === clave(p))) agregar(p)
  }
  for (const p of candidatas) if (!elegidas.some(e => disposicion(e) === disposicion(p))) agregar(p)
  // Selección por calidad; presentación por zona, comodidad y traste.
  return elegidas.sort((a, b) => a.distancia - b.distancia || Number(a.compleja) - Number(b.compleja) ||
    a.ancla - b.ancla || a.dificultad - b.dificultad || comparar(a, b))
}

function generarCompleto(acorde, zona) {
  const [preferidoDesde, preferidoHasta] = ZONAS[zona]
  const desde = Math.max(0, preferidoDesde - 2), hasta = Math.min(CANTIDAD_TRASTES, preferidoHasta + 2)
  const notasDisponibles = acorde.bajo && !acorde.notas.some(nota => nota.clase === acorde.bajo.clase)
    ? [...acorde.notas, acorde.bajo] : acorde.notas
  const requeridas = new Set([acorde.raiz.clase, ...acorde.notas.filter(nota => nota.esencial).map(nota => nota.clase)])
  const candidatas = AFINACION.map((_, cuerda) => posicionesEnCuerda(cuerda, notasDisponibles, desde, hasta, acorde.raiz))
  const resultados = []

  function buscar(cuerda, principal) {
    const clases = new Set(principal.map(nota => nota.clase))
    const pendientes = [...requeridas].filter(clase => !clases.has(clase)).length
    if (pendientes > 6 - cuerda || principal.length + 6 - cuerda < 3) return
    if (cuerda < 6) {
      // Puede dejar una cuerda sin tocar; se preserva como × al guardar.
      buscar(cuerda + 1, principal)
      for (const nota of candidatas[cuerda]) {
        if (principal.length && principal.at(-1).midi <= nota.midi) continue
        const siguientes = [...principal, nota]
        if (extension(siguientes) <= 4) buscar(cuerda + 1, siguientes)
      }
      return
    }
    if (clases.size < 3) return
    const ultima = principal.at(-1)
    if (acorde.bajo && ultima.clase !== acorde.bajo.clase) return
    const dedos = dedosNecesarios(principal)
    if (dedos > 4) return
    const notas = principal.map(nota => acorde.bajo && nota === ultima ? { ...nota, esBajo: true } : nota)
    const evaluacion = evaluarPropuesta(acorde, notas, zona, true)
    resultados.push({
      id: principal.map(({ cuerda, traste }) => `${cuerda}:${traste}`).join('-'),
      principal: notas, bajo: null, opcional: null, completo: true,
      cuerdaTonica: principal.find(nota => nota.esTonica)?.cuerda ?? null,
      ...evaluacion,
      // El modal conserva la información de omisiones del modo completo.
      omitidas: evaluacion.omisiones,
    })
  }
  buscar(0, [])
  return seleccionarPropuestas(resultados)
}

function combinaciones(candidatas, principal = []) {
  if (!candidatas.length) return [principal]
  return candidatas[0].flatMap((nota) => {
    if (principal.length && principal.at(-1).midi <= nota.midi) return []
    const siguientes = [...principal, nota]
    if (extension(siguientes) > 4) return []
    return combinaciones(candidatas.slice(1), siguientes)
  })
}

function sugerirTonica(acorde, principal, bajo, desde, hasta) {
  // La quinta omitida no justifica una sugerencia automática. Sólo se
  // completa una forma sin raíz, sin duplicar el bajo ni ocupar otra voz.
  const actuales = [...principal, ...(bajo ? [bajo] : [])]
  if (principal.length !== 3 || actuales.some(({ esTonica }) => esTonica)) return null
  const candidatas = AFINACION.flatMap((_, cuerda) => {
    if (actuales.some((nota) => nota.cuerda === cuerda)) return []
    if (Math.min(...principal.map((nota) => Math.abs(nota.cuerda - cuerda))) !== 1) return []
    return posicionesEnCuerda(cuerda, [acorde.notas[0]], desde, hasta, acorde.raiz)
      .filter((nota) => {
        const notas = [...actuales, nota].sort((a, b) => a.cuerda - b.cuerda)
        return extension(notas) <= 4 && dedosNecesarios(notas) <= 4 &&
          Math.min(...principal.map((actual) => Math.abs(actual.traste - nota.traste))) <= 2 &&
          notas.every((actual, i) => i === 0 || notas[i - 1].midi > actual.midi) &&
          (!bajo || nota.midi > bajo.midi)
      })
  })
  candidatas.sort((a, b) => extension([...actuales, a]) - extension([...actuales, b]) || a.traste - b.traste || a.cuerda - b.cuerda)
  return candidatas[0] ? { ...candidatas[0], esOpcional: true } : null
}

function generarGrupo(acorde, grupo, zona, conBajo) {
  const [preferidoDesde, preferidoHasta] = ZONAS[zona]
  const desde = Math.max(0, preferidoDesde - 2)
  const hasta = Math.min(CANTIDAD_TRASTES, preferidoHasta + 2)
  const distanciaZona = (notas) => Math.max(...notas.map(({ traste }) =>
    Math.max(0, preferidoDesde - traste, traste - preferidoHasta)
  ))
  const candidatas = grupo.map((cuerda) => posicionesEnCuerda(cuerda, acorde.notas, desde, hasta, acorde.raiz))
  const resultados = []
  for (const principal of combinaciones(candidatas)) {
    if (!representaAcorde(acorde, principal)) continue
    const ultima = principal.at(-1)
    let bajo = null
    if (conBajo) {
      const notaBajo = acorde.bajo ?? acorde.raiz
      const bajos = []
      for (let cuerda = Math.max(3, grupo.at(-1) + 1); cuerda < 6; cuerda++) {
        for (const posicion of posicionesEnCuerda(cuerda, [notaBajo], desde, hasta, acorde.raiz)) {
          const notas = [...principal, posicion]
          if (posicion.midi < ultima.midi && extension(notas) <= 4 && dedosNecesarios(notas) <= 4) bajos.push({ ...posicion, esBajo: true })
        }
      }
      bajos.sort((x, y) => distanciaZona([...principal, x]) - distanciaZona([...principal, y]) || extension([...principal, x]) - extension([...principal, y]) || x.midi - y.midi)
      if (!bajos.length) continue
      bajo = bajos[0]
    }
    const notas = bajo ? [...principal, bajo] : principal
    resultados.push({
      id: notas.map(({ cuerda, traste }) => `${cuerda}:${traste}`).join('-'),
      principal, bajo,
      cuerdaTonica: principal.find(({ esTonica }) => esTonica)?.cuerda ?? null,
      ...evaluarPropuesta(acorde, notas, zona),
    })
  }
  return resultados
}

export function generarPosiciones(acorde, { cuerdas = 'AUTO', cantidadCuerdas = 3, zona = 'TODAS', bajo = false, completo = false } = {}) {
  const interpretado = typeof acorde === 'string' ? interpretarAcorde(acorde) : acorde
  if (!interpretado || !ZONAS[zona]) return []
  if (completo) return generarCompleto(interpretado, zona)
  if (![3, 4].includes(cantidadCuerdas)) return []
  const conBajo = bajo || Boolean(interpretado.bajo)
  const grupos = cantidadCuerdas === 4 ? GRUPOS_CUERDAS_4 : GRUPOS_CUERDAS
  if (cuerdas !== 'AUTO' && !grupos[cuerdas]) return []
  // AUTO conserva sus grupos históricos, pero selecciona después de reunir
  // todos los candidatos: no recorta formas útiles antes de compararlas.
  const elegidos = cuerdas !== 'AUTO' ? [grupos[cuerdas]] : cantidadCuerdas === 4
    ? Object.values(grupos) : [grupos['1–2–3'], grupos['2–3–4']]
  const resultados = elegidos.flatMap(grupo => generarGrupo(interpretado, grupo, zona, conBajo))
  const [desde, hasta] = ZONAS[zona]
  return seleccionarPropuestas(resultados).map(forma => ({
    ...forma,
    opcional: sugerirTonica(interpretado, forma.principal, forma.bajo, Math.max(0, desde - 2), Math.min(CANTIDAD_TRASTES, hasta + 2)),
  }))
}

/** Usa el mismo formato para guardar directamente o abrir el editor. */
export function propuestaAEditable(acorde, propuesta) {
  const editable = crearAcorde()
  const notas = [...propuesta.principal, ...(propuesta.bajo ? [propuesta.bajo] : []), ...(propuesta.opcional ? [propuesta.opcional] : [])]
  const pisadas = notas.filter(({ traste }) => traste > 0).map(({ traste }) => traste)
  const inicio = pisadas.length ? Math.min(...pisadas) : 1
  const columnas = Math.max(4, (pisadas.length ? Math.max(...pisadas) : inicio) - inicio + 1)
  const trastes = Array.from({ length: columnas }, (_, i) => inicio + i)
  editable.nombre = acorde.nombre
  editable.trastes = trastes.map(String)
  editable.posiciones = Array.from({ length: 6 }, () => Array(columnas).fill('vacio'))
  if (propuesta.completo) {
    for (let cuerda = 0; cuerda < 6; cuerda++) {
      if (!notas.some(nota => nota.cuerda === cuerda)) editable.posiciones[cuerda][0] = 'muteada'
    }
  }
  for (const nota of notas) {
    const columna = nota.traste === 0 ? 0 : trastes.indexOf(nota.traste)
    editable.posiciones[nota.cuerda][columna] = nota.traste === 0 ? 'aire' : 'presionada'
    if (nota.esTonica && !nota.esBajo) editable.tonica = { cuerda: nota.cuerda, traste: columna }
    if (nota.esBajo) editable.bajo = { cuerda: nota.cuerda, traste: columna }
    if (nota.esOpcional) editable.opcional = { cuerda: nota.cuerda, traste: columna }
  }
  return editable
}
