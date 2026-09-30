/** Confirma una fila devuelta: RLS o un ID inexistente no deben simular éxito. */
export async function actualizarTema(cliente, temaId, campos) {
  const { data, error } = await cliente.from('temas').update(campos).eq('id', temaId).select('id').single()
  if (error) throw error
  if (!data || String(data.id) !== String(temaId)) throw new Error('No se pudo confirmar el guardado del tema.')
}
