import { useEffect, useId, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'

export default function MenuSetlist({ nombre, acciones, disabled = false }) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef(null)
  const boton = useRef(null)
  const id = useId()
  useEffect(() => {
    if (!abierto) return
    function afuera(e) { if (!contenedor.current?.contains(e.target)) setAbierto(false) }
    function teclado(e) {
      if (e.key === 'Escape') { setAbierto(false); boton.current?.focus() }
    }
    document.addEventListener('pointerdown', afuera)
    document.addEventListener('keydown', teclado)
    return () => {
      document.removeEventListener('pointerdown', afuera)
      document.removeEventListener('keydown', teclado)
    }
  }, [abierto])
  return <div ref={contenedor} className="relative shrink-0 self-start" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false) }}>
    <button ref={boton} type="button" disabled={disabled} aria-label={`Opciones de ${nombre}`} aria-expanded={abierto && !disabled} aria-controls={id}
      onClick={() => setAbierto(!abierto)} className="accion-plana accion-icono rounded-lg disabled:opacity-50"><MoreVertical /></button>
    {abierto && !disabled && <div id={id} className="absolute right-0 top-full z-20 w-52 rounded-lg border border-borde bg-superficie p-1 shadow-xl">
      {acciones.map(({ texto, ejecutar }) => <button key={texto} type="button" className="w-full min-h-11 rounded-lg px-3 py-2 text-left text-sm text-butter hover:bg-borde focus-visible:outline-2 focus-visible:outline-butter"
        onClick={() => { setAbierto(false); boton.current?.focus(); ejecutar() }}>{texto}</button>)}
    </div>}
  </div>
}
