import { normalizarEscala, TIPOS_ESCALA } from './escalas.js'
import { leerNotas, normalizarAcorde } from './notasConAcordes.js'
import { interpretarAcorde } from './generadorAcordes.js'

const normalizarTexto = texto => texto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('_', ' ')

function escalaDeReferencia(tema) {
  if (!tema.tonalidad?.trim()) return null
  const tonalidad = interpretarAcorde(tema.tonalidad)
  const nombreTipo = normalizarTexto(tema.escala_nombre ?? '')
  const tipo = TIPOS_ESCALA.find(opcion => [opcion.valor, opcion.etiqueta, opcion.etiqueta.split('(')[0]].some(nombre => normalizarTexto(nombre) === nombreTipo))?.valor
    ?? (nombreTipo === 'menor natural' ? 'menor' : null)
    ?? (!nombreTipo && tonalidad ? tonalidad.calidad === 'm' ? 'menor' : 'mayor' : null)
  if (!tonalidad || !['', 'm'].includes(tonalidad.calidad) || tonalidad.bajo || !tipo) {
    throw new Error('La referencia de tonalidad o escala no es compatible con el diapasón. Cargá un diagrama de escala en el tema para importarlo.')
  }
  return normalizarEscala({ tonica: tonalidad.raiz.nombre, tipo })
}

/** Sólo datos musicales; la referencia escrita se usa si no hay diagramas. */
export function prepararMusicaTema(tema, escalas) {
  const diagramas = escalas.map(normalizarEscala)
  const referencia = diagramas.length ? null : escalaDeReferencia(tema)
  return {
    nombre: tema.nombre,
    escalas: referencia ? [referencia] : diagramas,
    acordes: leerNotas(tema.notas).acordes,
  }
}

/** Esta ruta de lectura nunca recibe ni ejecuta funciones de escritura. */
export async function leerMusicaTema(cliente, temaId) {
  const [tema, escalas] = await Promise.all([
    cliente.from('temas').select('id,nombre,tonalidad,escala_nombre,notas').eq('id', temaId).single(),
    cliente.from('escalas').select('id,tonica,tipo,orden').eq('tema_id', temaId)
      .order('orden', { ascending: true }).order('created_at', { ascending: true }),
  ])
  if (tema.error || escalas.error || !tema.data || tema.data.id !== temaId || !Array.isArray(escalas.data)) {
    throw new Error('No se pudo cargar la información musical del tema. Revisá la conexión e intentá de nuevo.')
  }
  return prepararMusicaTema(tema.data, escalas.data)
}

/** Copias sin referencias compartidas, IDs de origen ni metadatos del tema. */
export function copiarMusicaAPizarra(musica) {
  const elementos = [
    ...musica.escalas.map(escala => ({ tipo: 'escala', datos: normalizarEscala({ ...escala, id: globalThis.crypto.randomUUID() }) })),
    ...musica.acordes.map(acorde => ({ tipo: 'acorde', datos: normalizarAcorde({ ...acorde, id: globalThis.crypto.randomUUID() }) })),
  ]
  if (!elementos.length) throw new Error('Este tema no tiene escalas ni acordes para cargar.')
  return { version: 1, elementos }
}
