import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { useTemas } from '../hooks/useTemas'
import NuevoTemaModal from '../components/NuevoTemaModal'

export default function Repertorio() {
  const { temas, cargando, recargar } = useTemas()
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
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

  function alCrearTema(id) {
    setModalAbierto(false)
    navegar(`/tema/${id}`)
  }

  return (
    <div className="min-h-dvh flex flex-col px-4 pt-6 pb-8">
      <h1 className="text-2xl text-center mb-5 text-butter">Y daaaale!</h1>

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
            <li key={t.id}>
              <button
                onClick={() => navegar(`/tema/${t.id}`)}
                className="w-full text-left bg-superficie hover:bg-borde rounded-lg px-4 py-3 transition-colors"
              >
                <p className="text-butter">{t.nombre}</p>
                {t.artista && <p className="text-sm text-butter-muted">{t.artista}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {modalAbierto && (
        <NuevoTemaModal
          onCerrar={() => setModalAbierto(false)}
          onCreado={(id) => {
            recargar()
            alCrearTema(id)
          }}
        />
      )}
    </div>
  )
}
