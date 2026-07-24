import { useParams, Link, NavLink, Outlet } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useTema } from '../hooks/useTema'

const SECCIONES = [
  { ruta: 'letra', etiqueta: 'Letra' },
  { ruta: 'estructura', etiqueta: 'Estructura' },
  { ruta: 'escala', etiqueta: 'Escala' },
  { ruta: 'percusion', etiqueta: 'Percusión' },
  { ruta: 'notas', etiqueta: 'Notas' },
]

export default function Tema() {
  const { id } = useParams()
  const { tema, cargando, actualizarCampoLocal } = useTema(id)

  if (cargando) {
    return <div className="min-h-dvh flex items-center justify-center text-butter-muted">Cargando…</div>
  }

  if (!tema) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 text-butter-muted">
        <p>No se encontró el tema.</p>
        <Link to="/" className="text-teal">Volver al repertorio</Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Volver: jerarquía visual distinta a las pestañas, no es "una más". */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Link
          to="/"
          aria-label="Volver al repertorio"
          className="p-2 -ml-2 rounded-lg hover:bg-superficie transition-colors"
        >
          <ChevronLeft size={22} className="text-butter" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-lg truncate text-butter">{tema.nombre}</h1>
          {tema.artista && (
            <p className="text-xs text-butter-muted truncate">{tema.artista}</p>
          )}
        </div>
      </div>

      <nav className="flex gap-1 px-3 mt-4 overflow-x-auto border-b border-borde">
        {SECCIONES.map((s) => (
          <NavLink
            key={s.ruta}
            to={s.ruta}
            className={({ isActive }) =>
              [
                'px-3 py-2 text-sm whitespace-nowrap rounded-t-lg transition-colors',
                isActive
                  ? 'text-butter border-b-2 border-teal'
                  : 'text-butter-muted hover:text-butter',
              ].join(' ')
            }
          >
            {s.etiqueta}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 p-4 min-h-0">
        <Outlet context={{ tema, actualizarCampoLocal }} />
      </main>
    </div>
  )
}
