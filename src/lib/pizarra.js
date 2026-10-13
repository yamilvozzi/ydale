import { normalizarEscala } from './escalas.js'
import { normalizarAcorde } from './notasConAcordes.js'
import { transponerNota, transponerDiagrama } from './transposicion.js'

export const CLAVE_PIZARRA = 'ydaaaale_pizarra_v1'
export const pizarraVacia = () => ({ version: 1, elementos: [] })
export const desplazamientoPizarra = pizarra => pizarra.desplazamiento ?? 0

export function transponerPizarra(pizarra, semitonos) {
  if (!Number.isSafeInteger(semitonos)) throw new Error('La transposición debe ser un número entero de semitonos.')
  if (!semitonos || !pizarra.elementos.length) return pizarra
  const desplazamiento = desplazamientoPizarra(pizarra) + semitonos
  if (!Number.isSafeInteger(desplazamiento)) throw new Error('El desplazamiento de la pizarra es demasiado grande.')
  const { desplazamiento: _anterior, ...datos } = pizarra
  return { ...datos, ...(desplazamiento ? { desplazamiento } : {}), elementos: pizarra.elementos.map(elemento => ({
    ...elemento,
    datos: elemento.tipo === 'escala'
      ? { ...elemento.datos, tonica: transponerNota(elemento.datos.tonica, semitonos) }
      : transponerDiagrama(elemento.datos, semitonos),
  })) }
}

export function reiniciarTransposicionPizarra(pizarra) {
  if (!pizarra.elementos.length) {
    const { desplazamiento: _anterior, ...datos } = pizarra
    return datos
  }
  return transponerPizarra(pizarra, -desplazamientoPizarra(pizarra))
}

export function leerPizarra(storage) {
  const texto = storage.getItem(CLAVE_PIZARRA)
  if (texto === null) return pizarraVacia()
  const datos = JSON.parse(texto)
  if (datos?.version !== 1 || !Array.isArray(datos.elementos)) throw new Error('Formato de pizarra inválido')
  if (datos.desplazamiento !== undefined && !Number.isSafeInteger(datos.desplazamiento)) throw new Error('Desplazamiento de pizarra inválido')
  const ids = new Set()
  return {
    version: 1,
    ...(datos.desplazamiento ? { desplazamiento: datos.desplazamiento } : {}),
    elementos: datos.elementos.map((elemento) => {
      if (!elemento || !['escala', 'acorde'].includes(elemento.tipo) || !elemento.datos ||
          typeof elemento.datos.id !== 'string' || !elemento.datos.id || ids.has(elemento.datos.id)) {
        throw new Error('Elemento de pizarra inválido')
      }
      ids.add(elemento.datos.id)
      return { tipo: elemento.tipo, datos: elemento.tipo === 'escala' ? normalizarEscala(elemento.datos) : normalizarAcorde(elemento.datos) }
    }),
  }
}

export function guardarPizarra(storage, pizarra) {
  storage.setItem(CLAVE_PIZARRA, JSON.stringify(pizarra))
}

export function ponerElemento(pizarra, tipo, datos) {
  const normalizar = tipo === 'escala' ? normalizarEscala : normalizarAcorde
  const elemento = { tipo, datos: normalizar({ ...datos, id: datos.id ?? globalThis.crypto.randomUUID() }) }
  const existe = pizarra.elementos.some((actual) => actual.datos.id === elemento.datos.id)
  return { ...pizarra, version: 1, elementos: existe
    ? pizarra.elementos.map((actual) => actual.datos.id === elemento.datos.id ? elemento : actual)
    : [...pizarra.elementos, elemento] }
}
