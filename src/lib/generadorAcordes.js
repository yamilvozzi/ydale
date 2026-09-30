import { AFINACION, CANTIDAD_TRASTES, NOTAS, notaEnTraste } from './escalas.js'
import { crearAcorde } from './notasConAcordes.js'

// Intervalo cromático y grado diatónico: conserva E# en C# y Gb en Ebm.
const FORMULAS = {
  '': [[0, 0], [4, 2], [7, 4]],
  m: [[0, 0], [3, 2], [7, 4]],
  '7': [[0, 0], [4, 2], [7, 4], [10, 6]],
  m7: [[0, 0], [3, 2], [7, 4], [10, 6]],
  maj7: [[0, 0], [4, 2], [7, 4], [11, 6]],
  sus2: [[0, 0], [2, 1], [7, 4]],
  sus4: [[0, 0], [5, 3], [7, 4]],
  '6': [[0, 0], [4, 2], [7, 4], [9, 5]],
  m6: [[0, 0], [3, 2], [7, 4], [9, 5]],
  dim: [[0, 0], [3, 2], [6, 4]],
  aug: [[0, 0], [4, 2], [8, 4]],
}
const NATURALES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const LETRAS = Object.keys(NATURALES)
const MIDI_AL_AIRE = [64, 59, 55, 50, 45, 40]
export const ZONAS = { ABIERTA: [0, 4], MEDIA: [5, 9], AGUDA: [10, CANTIDAD_TRASTES], TODAS: [0, CANTIDAD_TRASTES] }
export const GRUPOS_CUERDAS = { '1–2–3': [0, 1, 2], '2–3–4': [1, 2, 3], '4–5–6': [3, 4, 5] }
const modulo = (n) => (n + 120) % 12

function interpretarNota(texto) {
  const nombre = texto[0].toUpperCase() + texto.slice(1)
  return { nombre, clase: modulo(NATURALES[nombre[0]] + (nombre[1] === '#' ? 1 : nombre[1] === 'b' ? -1 : 0)) }
}

export function interpretarAcorde(texto) {
  if (typeof texto !== 'string') return null
  const partes = texto.trim().replaceAll('♯', '#').replaceAll('♭', 'b')
    .match(/^([A-Ga-g][#b]?)(maj7|m7|sus2|sus4|m6|dim|aug|m|7|6)?(?:\/([A-Ga-g][#b]?))?$/)
  if (!partes) return null
  const raiz = interpretarNota(partes[1])
  const calidad = partes[2] ?? ''
  const bajo = partes[3] ? interpretarNota(partes[3]) : null
  const notas = FORMULAS[calidad].map(([intervalo, grado]) => {
    const clase = modulo(raiz.clase + intervalo)
    const letra = LETRAS[(LETRAS.indexOf(raiz.nombre[0]) + grado) % 7]
    const diferencia = modulo(clase - NATURALES[letra] + 6) - 6
    return { clase, nombre: letra + (diferencia < 0 ? 'b'.repeat(-diferencia) : '#'.repeat(diferencia)) }
  })
  return {
    nombre: raiz.nombre + calidad + (bajo ? `/${bajo.nombre}` : ''), raiz, calidad, bajo, notas,
    voces: notas.length === 4 ? [notas[0], notas[1], notas[3]] : notas,
  }
}

function extension(notas) {
  const trastes = notas.map(({ traste }) => traste)
  return Math.max(...trastes) - Math.min(...trastes)
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

function generarGrupo(acorde, grupo, zona, conBajo) {
  const [preferidoDesde, preferidoHasta] = ZONAS[zona]
  const desde = Math.max(0, preferidoDesde - 2)
  const hasta = Math.min(CANTIDAD_TRASTES, preferidoHasta + 2)
  const distanciaZona = (notas) => Math.max(...notas.map(({ traste }) =>
    Math.max(0, preferidoDesde - traste, traste - preferidoHasta)
  ))
  const candidatas = grupo.map((cuerda) => posicionesEnCuerda(cuerda, acorde.voces, desde, hasta, acorde.raiz))
  const resultados = []
  for (const a of candidatas[0]) for (const b of candidatas[1]) for (const c of candidatas[2]) {
    const principal = [a, b, c]
    if (new Set(principal.map(({ clase }) => clase)).size !== 3 || extension(principal) > 4) continue
    // Mantiene las voces ordenadas sobre cuerdas consecutivas, sin cruces.
    if (a.midi <= b.midi || b.midi <= c.midi) continue
    let bajo = null
    if (conBajo) {
      const notaBajo = acorde.bajo ?? acorde.raiz
      const bajos = []
      for (let cuerda = Math.max(3, grupo[2] + 1); cuerda < 6; cuerda++) {
        for (const posicion of posicionesEnCuerda(cuerda, [notaBajo], desde, hasta, acorde.raiz)) {
          if (posicion.midi < c.midi && extension([...principal, posicion]) <= 4) bajos.push({ ...posicion, esBajo: true })
        }
      }
      bajos.sort((x, y) => distanciaZona([...principal, x]) - distanciaZona([...principal, y]) || extension([...principal, x]) - extension([...principal, y]) || x.midi - y.midi)
      if (!bajos.length) continue
      bajo = bajos[0]
    }
    const notas = bajo ? [...principal, bajo] : principal
    const amplitud = a.midi - c.midi
    const trastesPisados = notas.filter(({ traste }) => traste > 0).map(({ traste }) => traste)
    resultados.push({
      id: notas.map(({ cuerda, traste }) => `${cuerda}:${traste}`).join('-'),
      principal, bajo,
      cuerdaTonica: principal.find(({ esTonica }) => esTonica).cuerda,
      // Primero la zona original; la tolerancia solo completa alternativas.
      ranking: [distanciaZona(notas), amplitud < 12 ? 0 : 1, extension(notas), new Set(trastesPisados).size, amplitud, Math.max(...notas.map(({ traste }) => traste))],
    })
  }
  resultados.sort(comparar)
  // Una forma por ubicación de la tónica; evita duplicados a la octava.
  return grupo.flatMap((cuerda) => {
    const forma = resultados.find(({ cuerdaTonica }) => cuerdaTonica === cuerda)
    return forma ? [forma] : []
  })
}

export function generarPosiciones(acorde, { cuerdas = 'AUTO', zona = 'TODAS', bajo = false } = {}) {
  const interpretado = typeof acorde === 'string' ? interpretarAcorde(acorde) : acorde
  if (!interpretado || !ZONAS[zona]) return []
  const conBajo = bajo || Boolean(interpretado.bajo)
  if (cuerdas === 'AUTO') return [
    ...generarGrupo(interpretado, GRUPOS_CUERDAS['1–2–3'], zona, conBajo),
    ...generarGrupo(interpretado, GRUPOS_CUERDAS['2–3–4'], zona, conBajo).sort(comparar).slice(0, 1),
  ].sort((a, b) => a.ranking[0] - b.ranking[0])
  if (!GRUPOS_CUERDAS[cuerdas]) return []
  return generarGrupo(interpretado, GRUPOS_CUERDAS[cuerdas], zona, conBajo).sort((a, b) => a.ranking[0] - b.ranking[0])
}

/** Pasa la propuesta al editor existente, sin guardar hasta su confirmación. */
export function propuestaAEditable(acorde, propuesta) {
  const editable = crearAcorde()
  const notas = propuesta.bajo ? [...propuesta.principal, propuesta.bajo] : propuesta.principal
  const pisadas = notas.filter(({ traste }) => traste > 0).map(({ traste }) => traste)
  const inicio = pisadas.length ? Math.min(...pisadas) : 1
  const columnas = Math.max(4, (pisadas.length ? Math.max(...pisadas) : inicio) - inicio + 1)
  const trastes = Array.from({ length: columnas }, (_, i) => inicio + i)
  editable.nombre = acorde.nombre
  editable.trastes = trastes.map(String)
  editable.posiciones = Array.from({ length: 6 }, () => Array(columnas).fill('vacio'))
  for (const nota of notas) {
    const columna = nota.traste === 0 ? 0 : trastes.indexOf(nota.traste)
    editable.posiciones[nota.cuerda][columna] = nota.traste === 0 ? 'aire' : 'presionada'
    if (nota.esTonica && !nota.esBajo) editable.tonica = { cuerda: nota.cuerda, traste: columna }
    if (nota.esBajo) editable.bajo = { cuerda: nota.cuerda, traste: columna }
  }
  return editable
}
