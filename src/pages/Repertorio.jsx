import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { useTemas } from '../hooks/useTemas'
import { supabase } from '../lib/supabaseClient'
import NuevoTemaModal from '../components/NuevoTemaModal'

export default function Repertorio() {
  const { temas, cargando, recargar } = useTemas()
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [temaEditando, setTemaEditando] = useState(null)
  const navegar = useNavigate()

  // Ocho temas: filtrar en el cliente es más simple que una consulta
  // a Supabase por cada letra tipeada, y no hay ninguna ganancia real.
  const temasFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return temas
    return temas.filter(
      (t) =>
        t.nombre.toLowerCase().includes(q) ||
        (t.artista ?? '').toLowerCase().includes(q)
    )
  }, [temas, busqueda])

  function cerrarModal() {
    setModalAbierto(false)
    setTemaEditando(null)
  }

  function alGuardar(id) {
    const eraCreacion = !temaEditando
    cerrarModal()
    recargar()
    if (eraCreacion && id) navegar(`/tema/${id}`)
  }

  async function eliminarTema(t, e) {
    e.stopPropagation()
    const confirmado = window.confirm(
      `¿Eliminar "${t.nombre}" del repertorio? Esta acción no se puede deshacer.`
    )
    if (!confirmado) return

    const { error } = await supabase.from('temas').delete().eq('id', t.id)
    if (error) {
      alert('No se pudo eliminar el tema. Probá de nuevo.')
      return
    }
    recargar()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 pt-6 pb-8">
      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-6">
          <h1 className="text-2xl tracking-widest uppercase text-butter bg-superficie border border-borde rounded-xl px-6 py-3 shadow-lg shadow-black/30">
            Y <span className="text-teal">daaaale!</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-butter-muted"
            />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-superficie border border-borde rounded-lg pl-10 pr-4 py-3 text-butter placeholder-butter-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
            />
          </div>

          <button
            onClick={() => setModalAbierto(true)}
            aria-label="Agregar tema"
            className="shrink-0 bg-teal hover:bg-green rounded-lg p-3 transition-colors"
          >
            <Plus size={22} className="text-butter" />
          </button>
        </div>

        {cargando ? (
          <p className="text-butter-muted text-center mt-8">Cargando…</p>
        ) : temasFiltrados.length === 0 ? (
          <p className="text-butter-muted text-center mt-8">
            {temas.length === 0 ? 'Todavía no hay temas cargados.' : 'No hay resultados.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {temasFiltrados.map((t) => (
              <li key={t.id} className="flex items-stretch gap-2">
                <button
                  onClick={() => navegar(`/tema/${t.id}`)}
                  className="flex-1 min-w-0 text-left bg-superficie hover:bg-borde rounded-lg px-4 py-3 transition-colors"
                >
                  <p className="text-butter truncate">{t.nombre}</p>
                  {t.artista && <p className="text-sm text-butter-muted truncate">{t.artista}</p>}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setTemaEditando(t)
                  }}
                  aria-label={`Editar ${t.nombre}`}
                  className="shrink-0 px-3 rounded-lg bg-superficie hover:bg-borde transition-colors"
                >
                  <Pencil size={16} className="text-butter-muted" />
                </button>

                <button
                  onClick={(e) => eliminarTema(t, e)}
                  aria-label={`Eliminar ${t.nombre}`}
                  className="shrink-0 px-3 rounded-lg bg-superficie hover:bg-borde transition-colors"
                >
                  <Trash2 size={16} className="text-butter-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(modalAbierto || temaEditando) && (
        <NuevoTemaModal
          onCerrar={cerrarModal}
          onGuardado={alGuardar}
          temaEditando={temaEditando}
        />
      )}
    </div>
  )
}
