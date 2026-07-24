import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function NuevoTemaModal({ onCerrar, onCreado }) {
  const [nombre, setNombre] = useState('')
  const [artista, setArtista] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function crear(e) {
    e.preventDefault()
    if (!nombre.trim()) return

    setGuardando(true)
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

    onCreado(data.id)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <form
        onSubmit={crear}
        className="w-full max-w-sm bg-superficie border border-borde rounded-lg p-5 flex flex-col gap-4"
      >
        <h2 className="text-lg text-butter">Nuevo tema</h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-butter-muted uppercase tracking-wide">Tema</label>
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="bg-fondo border border-borde rounded-lg p-3 text-butter focus:outline-none focus:border-teal"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-butter-muted uppercase tracking-wide">Artista</label>
          <input
            value={artista}
            onChange={(e) => setArtista(e.target.value)}
            placeholder="Y daaaale! (si es propio)"
            className="bg-fondo border border-borde rounded-lg p-3 text-butter placeholder-butter-muted focus:outline-none focus:border-teal"
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
            Crear
          </button>
        </div>
      </form>
    </div>
  )
}
