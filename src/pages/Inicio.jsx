import { Guitar, NotebookPen, ListMusic, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function Inicio() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6">
      <h1><Logo /></h1>
      <nav aria-label="Navegación principal" className="grid w-full max-w-2xl gap-4 lg:max-w-4xl lg:grid-cols-3">
        {[
          { ruta: '/repertorio', nombre: 'REPERTORIO', Icono: Guitar },
          { ruta: '/pizarra', nombre: 'PIZARRA', Icono: NotebookPen },
          { ruta: '/setlists', nombre: 'SETLISTS', Icono: ListMusic },
        ].map(({ ruta, nombre, Icono }) => (
          <Link key={ruta} to={ruta} className="boton-funcion group flex items-center gap-4 rounded-xl px-6 py-8 focus-visible:outline-2 focus-visible:outline-butter">
            <Icono size={28} className="text-butter-muted group-hover:text-butter" />
            <span className="flex-1 text-base tracking-widest">{nombre}</span>
            <ChevronRight size={20} className="text-butter-muted" />
          </Link>
        ))}
      </nav>
    </main>
  )
}
