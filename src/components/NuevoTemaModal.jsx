import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Se usa tanto para crear un tema nuevo como para editar uno existente:
// si viene `temaEditando`, precarga los campos y hace UPDATE en vez de INSERT.
export default function NuevoTemaModal({ onCerrar, onGuardado, temaEditando = null }) {
  const esEdicion = Boolean(temaEditando)
  const [nombre, setNombre] = useState(temaEditando?.nombre ?? '')
  const [artista, setArtista] = useState(temaEditando?.artista ?? '')
  const [guardando, setGuardando] = useState(false)

  async function guardar(e) {
    e.preventDefault()
    if (!nombre.trim()) return

    setGuardando(true)

    if (esEdicion) {
      const { error } = await supabase
        .from('temas')
        .update({ nombre: nombre.trim(), artista: artista.trim() || null })
        .eq('id', temaEditando.id)
      setGuardando(false)

      if (error) {
        alert('No se pudo guardar los cambios. Probá de nuevo.')
        return
      }

      onGuardado()
      return
    }

    const { data, error } = await supabase
      .from('temas')
      .insert({ nombre: nombre.trim(), artista: artista.trim() || null })
      .select('id')
      .single()
    setGuardando(false)

    if (error) {
      alert('No se pudo crear el tema. Probá de nuevo.')
      return
    }

    onGuardado(data.id)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <form
        onSubmit={guardar}
        className="w-full max-w-sm bg-superficie border border-borde rounded-lg p-5 flex flex-col gap-4"
      >
        <h2 className="text-lg text-butter">{esEdicion ? 'Editar tema' : 'Nuevo tema'}</h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-butter-muted uppercase tracking-wide">Tema</label>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="bg-fondo border border-borde rounded-lg p-3 text-butter focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-butter-muted uppercase tracking-wide">Artista</label>
          <input
            value={artista}
            onChange={(e) => setArtista(e.target.value)}
            placeholder="Y daaaale! (si es propio)"
            className="bg-fondo border border-borde rounded-lg p-3 text-butter placeholder-butter-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
          />
        </div>

        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-lg text-butter-muted hover:bg-fondo transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !nombre.trim()}
            className="px-4 py-2 rounded-lg bg-teal hover:bg-green text-butter transition-colors disabled:opacity-50"
          >
            {esEdicion ? 'Guardar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  )
}
