export function fechaSetlist(fecha) {
  const [anio, mes, dia] = fecha.split('-')
  return `${dia}/${mes}/${anio}`
}

export function mensajeErrorSetlists(error) {
  if (error?.code === '40001') return 'Este setlist cambió en otra sesión. Recargá para ver la versión actual antes de volver a editar.'
  if (['42P01', '42883', 'PGRST200', 'PGRST202', 'PGRST205'].includes(error?.code)) {
    return 'Falta instalar Setlists en la base de datos. Ejecutá el SQL indicado en docs/setlists.md.'
  }
  if (error?.code === '23503') return 'Una canción ya no está en Repertorio. Recargá el setlist para actualizar sus referencias.'
  return 'No se pudo completar la operación. Revisá la conexión y volvé a intentar.'
}

function comprobar(data, error) {
  if (error) throw error
  if (!data) throw new Error('La base de datos no confirmó la operación.')
  return data
}

// Único punto de escritura: RPC transaccional. Jamás escribe en temas.
export function repositorioSetlists(cliente) {
  return {
    async listar() {
      const { data, error } = await cliente.from('setlists')
        .select('id, title, date, place, revision, created_at, setlist_songs(count)')
        .order('date', { ascending: false }).order('created_at', { ascending: false }).order('id')
      return comprobar(data, error)
    },
    async leer(id) {
      const { data, error } = await cliente.rpc('ydale_get_setlist', { p_id: id })
      if (error) throw error
      return data
    },
    async guardar(setlist, items = setlist.items) {
      const { data, error } = await cliente.rpc('ydale_save_setlist', {
        p_id: setlist.id,
        p_revision: setlist.revision ?? null,
        p_title: setlist.title.trim(),
        p_date: setlist.date,
        p_place: setlist.place?.trim() || null,
        p_items: items.map(({ id, song_id }) => ({ id, song_id })),
      })
      const guardado = comprobar(data, error)
      if (guardado.id !== setlist.id || !Number.isInteger(guardado.revision)) throw new Error('Respuesta de guardado inválida.')
      return { ...guardado, items }
    },
    async duplicar(id, evento) {
      // Una sola lectura obtiene metadatos y referencias en la misma instantánea.
      const original = await this.leer(id)
      if (!original) throw new Error('No se encontró el setlist original.')
      return this.guardar({ ...evento, id: crypto.randomUUID(), revision: null },
        original.items.map(({ song_id }) => ({ id: crypto.randomUUID(), song_id })))
    },
    async eliminar(setlist) {
      const { data, error } = await cliente.rpc('ydale_delete_setlist', { p_id: setlist.id, p_revision: setlist.revision })
      if (comprobar(data, error) !== setlist.id) throw new Error('No se confirmó la eliminación.')
    },
  }
}
