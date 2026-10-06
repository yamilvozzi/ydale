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
    const distancia = Math.max(...principal.map(({ traste }) => Math.max(0, preferidoDesde - traste, traste - preferidoHasta)))
    const omitidas = notasOmitidas(acorde, principal)
    const notas = principal.map(nota => acorde.bajo && nota === ultima ? { ...nota, esBajo: true } : nota)
    const pisadas = principal.filter(nota => nota.traste > 0).map(nota => nota.traste)
    resultados.push({
      id: principal.map(({ cuerda, traste }) => `${cuerda}:${traste}`).join('-'),
      principal: notas, bajo: null, opcional: null, completo: true, omitidas, dedos,
      cuerdaTonica: principal.find(nota => nota.esTonica)?.cuerda ?? null,
      ancla: pisadas.length ? Math.min(...pisadas) : 0,
      // Cobertura e identidad primero. La zona y las digitaciones sencillas
      // ordenan únicamente las formas que ya superaron el filtro físico.
      ranking: [omitidas.length, perdidaMusical(acorde, principal), distancia,
        ultima.esTonica ? 0 : 1, -principal.length, dedos, extension(principal), Math.max(...principal.map(nota => nota.traste))],
    })
  }
  buscar(0, [])
  resultados.sort(comparar)
  if (!resultados.length) return []
  // No mezcla formas con menos grados si ya hay una cobertura mayor tocable.
  const mejorCobertura = resultados[0].omitidas.length
  const lugares = new Set()
  return resultados.filter(propuesta => {
    if (propuesta.omitidas.length !== mejorCobertura) return false
    const lugar = Math.floor(propuesta.ancla / 3)
    if (lugares.has(lugar)) return false
    lugares.add(lugar)
    return true
  })
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
    const amplitud = principal[0].midi - ultima.midi
    // El bajo también aporta un grado: no premiar duplicar su tónica arriba
    // a costa de perder una quinta, novena u otra voz que todavía falta.
    const faltantes = notasOmitidas(acorde, notas).length
    const trastesPisados = notas.filter(({ traste }) => traste > 0).map(({ traste }) => traste)
    resultados.push({
      id: notas.map(({ cuerda, traste }) => `${cuerda}:${traste}`).join('-'),
      principal, bajo,
      cuerdaTonica: principal.find(({ esTonica }) => esTonica)?.cuerda ?? null,
      // Primero la zona original; la tolerancia solo completa alternativas.
      ranking: [distanciaZona(notas), grupo.length === 4 ? faltantes : 0, acorde.notas.length > 4 ? perdidaMusical(acorde, notas) : 0, amplitud < 12 ? 0 : 1, extension(notas), new Set(trastesPisados).size, amplitud, Math.max(...notas.map(({ traste }) => traste))],
    })
  }
  resultados.sort(comparar)
  // Conserva las inversiones habituales y agrega una alternativa sin raíz
  // cuando mantiene las voces características, sin duplicados a la octava.
  return [...grupo, null].flatMap((cuerda) => {
    const forma = resultados.find(({ cuerdaTonica }) => cuerdaTonica === cuerda)
    return forma ? [{ ...forma, opcional: sugerirTonica(acorde, forma.principal, forma.bajo, desde, hasta) }] : []
  })
}

export function generarPosiciones(acorde, { cuerdas = 'AUTO', cantidadCuerdas = 3, zona = 'TODAS', bajo = false, completo = false } = {}) {
  const interpretado = typeof acorde === 'string' ? interpretarAcorde(acorde) : acorde
  if (!interpretado || !ZONAS[zona]) return []
  if (completo) return generarCompleto(interpretado, zona)
  if (![3, 4].includes(cantidadCuerdas)) return []
  const conBajo = bajo || Boolean(interpretado.bajo)
  const grupos = cantidadCuerdas === 4 ? GRUPOS_CUERDAS_4 : GRUPOS_CUERDAS
  if (cantidadCuerdas === 4 && cuerdas === 'AUTO') {
    return Object.values(grupos).flatMap((grupo) => generarGrupo(interpretado, grupo, zona, conBajo).sort(comparar).slice(0, 2)).sort(comparar)
  }
  if (cuerdas === 'AUTO') return [
    ...generarGrupo(interpretado, GRUPOS_CUERDAS['1–2–3'], zona, conBajo),
    ...generarGrupo(interpretado, GRUPOS_CUERDAS['2–3–4'], zona, conBajo).sort(comparar).slice(0, 1),
  ].sort((a, b) => a.ranking[0] - b.ranking[0])
  if (!grupos[cuerdas]) return []
  const resultados = generarGrupo(interpretado, grupos[cuerdas], zona, conBajo)
  return resultados.sort(cantidadCuerdas === 4 ? comparar : (a, b) => a.ranking[0] - b.ranking[0])
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
