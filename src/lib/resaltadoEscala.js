import { obtenerMarcadoresEscala, NOTAS } from './escalas.js'
import { interpretarAcorde } from './generadorAcordes.js'

/** Capa visual: conserva exactamente las notas y grafías de la escala. */
export function obtenerMarcadoresEscalaConAcorde(tonica, tipo, nombreAcorde) {
  const marcadores = obtenerMarcadoresEscala(tonica, tipo)
  const acorde = interpretarAcorde(nombreAcorde)
  if (!acorde) return marcadores
  const clases = new Set([...acorde.notas, ...(acorde.bajo ? [acorde.bajo] : [])].map(nota => nota.clase))
  return new Map([...marcadores].map(([nota, marcador]) => [nota, {
    ...marcador,
    esAtenuada: !clases.has(NOTAS.indexOf(nota)),
  }]))
}
