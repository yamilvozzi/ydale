import { useParams, useLocation, Link, NavLink, Outlet } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useTema } from '../hooks/useTema'
import { origenTema } from '../lib/navegacionTema'

const SECCIONES = [
  { ruta: 'letra', etiqueta: 'Letra' },
  { ruta: 'estructura', etiqueta: 'Estructura' },
  { ruta: 'escala', etiqueta: 'Escala' },
  { ruta: 'notas', etiqueta: 'Acordes' },
  { ruta: 'percusion', etiqueta: 'Percusión' },
]

export default function Tema() {
  const { id } = useParams()
  const location = useLocation()
  const origen = origenTema(location.search)
  const { tema, cargando, actualizarCampoLocal } = useTema(id)

  if (cargando) {
    return <div className="min-h-dvh flex items-center justify-center text-butter-muted">Cargando…</div>
  }

  if (!tema) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 text-butter-muted">
        <p>No se encontró el tema.</p>
        <Link to={origen.ruta} state={location.state} className="text-teal">{origen.etiqueta}</Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Sólo la cabecera limita su ancho; el contenido musical es independiente. */}
      <header className="px-4 sm:px-6 lg:px-8 pt-4">
        <div className="columna-encabezado">
          <Link
            to={origen.ruta}
            state={location.state}
            aria-label={origen.etiqueta}
            className="accion-plana inline-flex min-h-11 min-w-11 items-center justify-center p-2 -ml-2 rounded-lg"
          >
            <ChevronLeft size={22} className="text-butter" />
          </Link>
          <div className="mt-2 min-w-0 text-center">
            <h1 className="text-lg break-words text-butter">{tema.nombre}</h1>
            {tema.artista && (
              <p className="text-xs text-butter-muted break-words">{tema.artista}</p>
            )}
          </div>

          <nav aria-label="Secciones del tema" className="tema-pestanas mt-4 border-b border-borde">
            {SECCIONES.map((s) => (
              <NavLink
                key={s.ruta}
                to={{ pathname: s.ruta, search: origen.search }}
                state={location.state}
                className="pestana-tema text-center px-1 py-3 text-sm sm:px-3 sm:text-base whitespace-nowrap rounded-t-lg transition-colors"
              >
                {s.etiqueta}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="w-full flex flex-col flex-1 p-4 sm:p-6 lg:px-8 min-h-0">
        <Outlet context={{ tema, actualizarCampoLocal }} />
      </main>
    </div>
  )
}
