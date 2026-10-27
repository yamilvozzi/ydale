// El origen viaja también en las pestañas y sobrevive a una recarga del URL.
export function origenTema(search) {
  const id = new URLSearchParams(search).get('setlist')
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { ruta: '/repertorio', etiqueta: 'Volver al repertorio', search: '' }
  }
  return { ruta: `/setlists/${id}`, etiqueta: 'Volver al setlist', search: `?setlist=${id}` }
}
