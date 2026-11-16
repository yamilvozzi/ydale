import { normalizarAcorde } from './notasConAcordes.js'
import { reordenarGrupo } from './ordenTarjetas.js'

export const MAX_COMPASES = 256
export const COLUMNAS_BLOQUES = ['izquierda', 'derecha']
export const nombreAcordeBloque = ({ nombre, digitacion }) => (nombre ?? digitacion?.nombre)?.trim() || 'Sin nombre'
export const seccionesBloque = bloque => bloque.tipo === 'libre' ? [bloque.acordes] : bloque.compases
export const columnaBloque = bloque => bloque.columna ?? 'izquierda'
export const ordenarBloques = bloques => COLUMNAS_BLOQUES.flatMap(columna => bloques.filter(bloque => columnaBloque(bloque) === columna))

export function validarNombreAcordeBloque(nombre) {
  return nombre.length <= 64 && /^[A-G][\p{L}\p{N}#♯♭+()°Δ△ø/., −-]*$/iu.test(nombre)
}

export function conSeccionesBloque(bloque, secciones) {
  return bloque.tipo === 'libre' ? { ...bloque, acordes: secciones[0] } : { ...bloque, compases: secciones }
}

export function normalizarBloque(datos) {
  const { id, titulo, repeticiones, tipo } = datos
  const columna = columnaBloque(datos)
  if (typeof titulo !== 'string' || !Number.isSafeInteger(repeticiones) || repeticiones < 1 ||
      !COLUMNAS_BLOQUES.includes(columna)) {
    throw new Error('Configuración de bloque inválida')
  }
  const ids = new Set()
  function leerAcordes(acordes) {
    if (!Array.isArray(acordes)) throw new Error('Compás de bloque inválido')
    return acordes.map(entrada => {
      if (typeof entrada?.id !== 'string' || !entrada.id || ids.has(entrada.id)) {
        throw new Error('Acorde de bloque inválido')
      }
      const { id, nombre, digitacion } = entrada
      const conNombre = typeof nombre === 'string' && Boolean(nombre.trim())
      if ((nombre !== undefined && !conNombre) || (digitacion && (typeof digitacion.id !== 'string' || !digitacion.id)) ||
          (!conNombre && !digitacion)) throw new Error('Acorde de bloque inválido')
      ids.add(entrada.id)
      return { id, ...(conNombre ? { nombre } : {}), ...(digitacion ? { digitacion: normalizarAcorde(digitacion) } : {}) }
    })
  }
  const base = { id, titulo, repeticiones, tipo, columna }
  if (tipo === 'libre') return { ...base, acordes: leerAcordes(datos.acordes) }
  if (tipo !== 'compases' || !Array.isArray(datos.compases) || !datos.compases.length ||
      datos.compases.length > MAX_COMPASES) throw new Error('Compases de bloque inválidos')
  return { ...base, compases: datos.compases.map(leerAcordes) }
}

export function configurarBloque(bloque, { titulo, cantidad, repeticiones }) {
  const base = { id: bloque?.id, titulo: titulo.trim(), repeticiones, columna: columnaBloque(bloque ?? {}) }
  const secciones = bloque ? seccionesBloque(bloque) : []
  if (!cantidad) return { ...base, tipo: 'libre', acordes: secciones.flat() }

  // Al reducir, los acordes de los compases sobrantes se agregan al último.
  // Desde libre, distribuimos de a uno hasta llenar los compases disponibles.
  const partes = bloque?.tipo === 'libre' ? bloque.acordes.map(acorde => [acorde]) : secciones
  return { ...base, tipo: 'compases', compases: Array.from({ length: cantidad }, (_, indice) =>
    indice === cantidad - 1 ? partes.slice(indice).flat() : partes[indice] ?? [],
  ) }
}

function insertarEnLista(lista, entrada, referencia, despues) {
  const posicion = referencia === undefined ? -1 : lista.findIndex(({ id }) => id === referencia)
  const indice = posicion < 0 ? lista.length : posicion + Number(Boolean(despues))
  return [...lista.slice(0, indice), entrada, ...lista.slice(indice)]
}

function editarCompas(bloque, compas, transformar) {
  const secciones = [...seccionesBloque(bloque)]
  secciones[compas] = transformar(secciones[compas])
  return conSeccionesBloque(bloque, secciones)
}

export function insertarAcordeBloque(bloque, compas, acorde, referencia, despues) {
  const datos = typeof acorde === 'string' ? { nombre: acorde } : { digitacion: normalizarAcorde(acorde) }
  const entrada = { id: globalThis.crypto.randomUUID(), ...datos }
  return editarCompas(bloque, compas, acordes => insertarEnLista(acordes, entrada, referencia, despues))
}

export function moverBloque(elementos, id, { columna, referencia, despues }) {
  const bloques = elementos.filter(({ tipo }) => tipo === 'bloque').map(({ datos }) => datos)
  const origen = bloques.find(bloque => bloque.id === id)
  if (!origen || referencia === id || !COLUMNAS_BLOQUES.includes(columna)) return elementos
  const destino = bloques.filter(bloque => bloque.id !== id && columnaBloque(bloque) === columna)
  const ordenados = insertarEnLista(destino, { ...origen, columna }, referencia, despues)
  const otraColumna = bloques.filter(bloque => bloque.id !== id && columnaBloque(bloque) !== columna)
  const lista = ordenarBloques([...ordenados, ...otraColumna])
  const porId = new Map(lista.map(bloque => [bloque.id, bloque]))
  return reordenarGrupo(elementos, 'bloque', lista).map(elemento =>
    elemento.tipo === 'bloque' ? { ...elemento, datos: porId.get(elemento.datos.id) } : elemento,
  )
}

export function colocarAcordeEnBloque(elementos, origen, destino) {
  const destinoBloque = elementos.find(elemento => elemento.tipo === 'bloque' && elemento.datos.id === destino.bloqueId)?.datos
  if (!destinoBloque || !seccionesBloque(destinoBloque)[destino.compas]) return elementos
  if (origen.tipo === 'acorde') {
    const acorde = elementos.find(elemento => elemento.tipo === 'acorde' && elemento.datos.id === origen.id)?.datos
    if (!acorde) return elementos
    const bloque = insertarAcordeBloque(destinoBloque, destino.compas, acorde, destino.referencia, destino.despues)
    return elementos.map(elemento => elemento.datos.id === bloque.id ? { ...elemento, datos: bloque } : elemento)
  }

  const origenBloque = elementos.find(elemento => elemento.tipo === 'bloque' && elemento.datos.id === origen.bloqueId)?.datos
  if (!origenBloque) return elementos
  const entrada = seccionesBloque(origenBloque)[origen.compas]?.find(({ id }) => id === origen.entradaId)
  if (!entrada) return elementos
  const mismoBloque = origenBloque === destinoBloque
  if (mismoBloque && origen.compas === destino.compas && destino.referencia === entrada.id) return elementos
  const sinEntrada = editarCompas(origenBloque, origen.compas, acordes => acordes.filter(({ id }) => id !== entrada.id))
  const bloqueFinal = mismoBloque ? sinEntrada : destinoBloque
  // Las copias históricas de bloques podían compartir IDs locales de acordes.
  const coincideId = !mismoBloque && seccionesBloque(bloqueFinal).some(lista => lista.some(({ id }) => id === entrada.id))
  const movida = coincideId ? { ...entrada, id: globalThis.crypto.randomUUID() } : entrada
  const conEntrada = editarCompas(bloqueFinal, destino.compas, acordes =>
    insertarEnLista(acordes, movida, destino.referencia, destino.despues),
  )
  return elementos.map(elemento => {
    if (elemento.datos.id === conEntrada.id) return { ...elemento, datos: conEntrada }
    if (elemento.datos.id === sinEntrada.id) return { ...elemento, datos: sinEntrada }
    return elemento
  })
}

export function describirDigitacion(acorde) {
  return acorde.posiciones.map(fila => {
    if (fila.includes('muteada')) return '×'
    if (fila.includes('aire')) return '0'
    return fila.flatMap((estado, i) => estado === 'presionada' ? [acorde.trastes[i].trim() || '?'] : []).join('/') || '–'
  }).join(' · ')
}

export function variantesDigitacion({ nombre, digitacion }, acordes) {
  const variantes = digitacion ? [digitacion] : []
  const huella = ({ trastes, posiciones, tonica, bajo, opcional }) =>
    JSON.stringify([trastes, posiciones, tonica, bajo, opcional])
  const vistas = new Set(variantes.map(huella))
  const cotejar = cifrado => cifrado?.trim().replaceAll('♯', '#').replaceAll('♭', 'b')
    .replace(/\(([b#]\d+)\)/g, '$1').replace(/^[a-g]/, letra => letra.toUpperCase())
  const cifrado = cotejar(nombre ?? digitacion?.nombre)
  if (!cifrado) return variantes

  for (const acorde of acordes) {
    if (cotejar(acorde.nombre) !== cifrado) continue
    const clave = huella(acorde)
    if (vistas.has(clave)) continue
    vistas.add(clave)
    variantes.push(acorde)
  }
  return variantes
}
