import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import CirculoQuintas from './CirculoQuintas'
import { calcularTonalidad, claseDeNota, nombreAcorde } from '../lib/circuloQuintas'

export default function CirculoQuintasModal({ onCerrar }) {
  const dialogo = useRef(null)
  const cerrar = useRef(null)
  const id = useId()
  const [seleccion, setSeleccion] = useState({ tonica: 'C', modo: 'mayor' })
  const tonalidad = calcularTonalidad(seleccion.tonica, seleccion.modo)
  const tieneEquivalente = claseDeNota(seleccion.tonica) === (seleccion.modo === 'mayor' ? 6 : 3)
  const equivalente = seleccion.tonica.includes('b')
    ? seleccion.modo === 'mayor' ? 'F#' : 'D#'
    : seleccion.modo === 'mayor' ? 'Gb' : 'Eb'

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    const modal = dialogo.current
    document.body.style.overflow = 'hidden'
    modal.showModal()
    cerrar.current.focus()
    return () => {
      modal.close()
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  return (
    <dialog ref={dialogo} aria-labelledby={`${id}-titulo`}
      onCancel={(evento) => { evento.preventDefault(); onCerrar() }}
      className="circulo-modal fixed inset-0 m-auto overflow-y-auto rounded-xl border border-borde bg-superficie text-butter shadow-2xl backdrop:bg-black/70"
    >
      <header className="circulo-modal-cabecera">
        <h2 id={`${id}-titulo`} className="text-lg modal-titulo">Círculo de 5tas</h2>
        <button ref={cerrar} type="button" onClick={onCerrar} aria-label="Cerrar círculo de quintas" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-butter-muted hover:bg-fondo hover:text-butter focus-visible:outline-2 focus-visible:outline-butter"><X size={20} /></button>
      </header>
      <CirculoQuintas tonalidad={tonalidad} onSeleccionar={setSeleccion} />
      {tieneEquivalente && <footer className="circulo-modal-pie">
        <button type="button" onClick={() => setSeleccion({ ...seleccion, tonica: equivalente })} className="min-h-11 rounded-lg border border-borde px-3 text-xs text-butter-muted hover:bg-fondo hover:text-butter">
          Misma tonalidad · Ver como {nombreAcorde(equivalente, seleccion.modo)}
        </button>
      </footer>}
    </dialog>
  )
}
