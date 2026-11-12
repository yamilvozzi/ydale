import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

export const botonPizarra = 'min-h-11 rounded-lg border border-borde bg-fondo px-3 py-2 text-sm text-butter hover:bg-borde disabled:opacity-50'
export const botonPrincipalPizarra = 'min-h-11 rounded-lg bg-teal px-3 py-2 text-sm text-butter hover:bg-green disabled:opacity-50'

export default function DialogoPizarra({ titulo, onCerrar, ocupado, amplio, children }) {
  const id = useId()
  const dialogo = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    const modal = dialogo.current
    modal.showModal()
    return () => {
      modal.close()
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  return <dialog ref={dialogo} aria-labelledby={id} aria-busy={ocupado}
    onCancel={e => { e.preventDefault(); if (!ocupado) onCerrar() }}
    className={`fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto overscroll-contain rounded-xl border border-borde bg-superficie p-4 text-butter shadow-2xl backdrop:bg-black/70 sm:p-5 ${amplio ? 'max-w-2xl' : 'max-w-sm'}`}>
    <header className="mb-4 flex min-w-0 items-center justify-between gap-2">
      <h2 id={id} className="min-w-0 break-words text-lg modal-titulo">{titulo}</h2>
      <button type="button" onClick={onCerrar} disabled={ocupado} aria-label="Cerrar diálogo" className="accion-icono shrink-0 rounded-lg text-butter-muted hover:bg-fondo hover:text-butter disabled:opacity-50"><X size={20} /></button>
    </header>
    {children}
  </dialog>
}
