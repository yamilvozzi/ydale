/** Reordena sólo un grupo de la pizarra, conservando los huecos del otro. */
export function reordenarGrupo(elementos, tipo, ordenados) {
  const originales = elementos.filter((elemento) => elemento.tipo === tipo)
  const porId = new Map(originales.map((elemento) => [elemento.datos.id, elemento]))
  if (ordenados.length !== originales.length || new Set(ordenados.map(({ id }) => id)).size !== originales.length ||
      ordenados.some(({ id }) => !porId.has(id))) throw new Error('Orden inválido')
  let indice = 0
  return elementos.map((elemento) => elemento.tipo === tipo ? porId.get(ordenados[indice++].id) : elemento)
}

/** Un único upsert guarda todas las posiciones en una transacción de Postgres. */
export async function guardarOrdenEscalas(cliente, temaId, escalas) {
  const filas = escalas.map(({ id, tonica, tipo }, orden) => ({ id, tema_id: temaId, tonica, tipo, orden }))
  const { data, error } = await cliente.from('escalas').upsert(filas, { onConflict: 'id' }).select('id')
  if (error) throw error
  if (data?.length !== filas.length || filas.some(({ id }) => !data.some((fila) => fila.id === id))) {
    throw new Error('No se pudo confirmar el orden de las escalas')
  }
  return escalas.map((escala, orden) => ({ ...escala, orden }))
}
