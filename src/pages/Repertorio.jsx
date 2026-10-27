import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { useTemas } from '../hooks/useTemas'
import { supabase } from '../lib/supabaseClient'
import NuevoTemaModal from '../components/NuevoTemaModal'
import EncabezadoSeccion from '../components/EncabezadoSeccion'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal'

export default function Repertorio() {
  const { temas, cargando, recargar } = useTemas()
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [temaEditando, setTemaEditando] = useState(null)
  const [temaAEliminar, setTemaAEliminar] = useState(null)
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

  async function eliminarTema(t) {
    const { error } = await supabase.from('temas').delete().eq('id', t.id)
    if (error) {
      return false
    }
    await recargar()
    return true
  }

  return (
    <div className="min-h-dvh flex flex-col px-4 sm:px-6 lg:px-8 pt-6 pb-8">
      <EncabezadoSeccion titulo="REPERTORIO" />
      <div className="mx-auto w-full max-w-3xl">
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
          <ul className="flex w-full flex-col gap-2">
            {temasFiltrados.map((t) => (
              <li key={t.id} className="flex w-full min-w-0 items-stretch rounded-lg border border-borde bg-superficie">
                <button
                  onClick={() => navegar(`/tema/${t.id}`)}
                  className="flex-1 min-w-0 rounded-l-lg px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-butter"
                >
                  <p className="break-words text-butter">{t.nombre}</p>
                  {t.artista && <p className="break-words text-sm text-butter-muted">{t.artista}</p>}
                </button>

                <div className="flex w-11 shrink-0 flex-col justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setTemaEditando(t)
                    }}
                    aria-label={`Editar ${t.nombre}`}
                    className="accion-icono rounded-lg text-butter-muted hover:text-butter transition-colors"
                  >
                    <Pencil />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); setTemaAEliminar(t) }}
                    aria-label={`Eliminar ${t.nombre}`}
                    className="accion-icono rounded-lg text-butter-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {temaAEliminar && <ConfirmarEliminacionModal
        destructiva
        mensaje={`¿Seguro que querés eliminar “${temaAEliminar.nombre}” del repertorio?`}
        onCancelar={() => setTemaAEliminar(null)}
        onConfirmar={() => eliminarTema(temaAEliminar)}
      />}

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
