import { generarPosiciones } from './generadorAcordes.js'

// Adaptador de interfaz: AUTO permite recorrer ambas búsquedas originales.
// Alterna las listas conservando todas las propuestas y su orden relativo.
export function propuestasDelModal(acorde, { cuerdas = 'AUTO', ...opciones } = {}) {
  if (opciones.completo || cuerdas !== 'AUTO') {
    return generarPosiciones(acorde, { ...opciones, cuerdas, cantidadCuerdas: cuerdas === 'AUTO' ? 3 : cuerdas.split('–').length })
  }
  const tres = generarPosiciones(acorde, { ...opciones, cuerdas, cantidadCuerdas: 3 })
  const cuatro = generarPosiciones(acorde, { ...opciones, cuerdas, cantidadCuerdas: 4 })
  return Array.from({ length: Math.max(tres.length, cuatro.length) }, (_, i) => [tres[i], cuatro[i]].filter(Boolean)).flat()
}
