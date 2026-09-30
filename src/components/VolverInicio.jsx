import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function VolverInicio() {
  return (
    <Link to="/" aria-label="Volver al inicio" className="inline-flex min-h-11 w-fit items-center gap-1 rounded-lg px-2 text-sm text-butter-muted hover:bg-superficie hover:text-butter">
      <ChevronLeft size={20} /> ATRÁS
    </Link>
  )
}
