import { useEffect, useId, useRef, useState } from 'react'

export default function ConfirmarEliminacionModal({ mensaje, onCancelar, onConfirmar }) {
  const dialogo = useRef(null)
  const cancelar = useRef(null)
  const enviando = useRef(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState(false)
  const id = useId()

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogo.current.showModal()
    cancelar.current.focus()
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  async function confirmar() {
    if (enviando.current) return
    enviando.current = true
    setOcupado(true)
    setError(false)
    try {
      if (await onConfirmar() === false) {
        setError(true)
      } else {
        onCancelar()
      }
    } catch {
      setError(true)
    } finally {
      enviando.current = false
      setOcupado(false)
    }
  }

  return (
    <dialog
      ref={dialogo}
      role="alertdialog"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={`${id}-mensaje`}
      aria-busy={ocupado}
      onCancel={(evento) => { evento.preventDefault(); if (!enviando.current) onCancelar() }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-sm overflow-y-auto rounded-xl border border-borde bg-superficie p-5 text-butter shadow-2xl backdrop:bg-black/70"
    >
      <h2 id={`${id}-titulo`} className="mb-3 text-lg">Confirmar eliminación</h2>
      <p id={`${id}-mensaje`} className="break-words text-sm text-butter-muted">{mensaje}</p>
      {error && <p role="alert" className="mt-3 text-sm text-butter-muted">No se pudo eliminar. Intentá de nuevo.</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button ref={cancelar} type="button" disabled={ocupado} onClick={onCancelar} className="rounded-lg border border-borde bg-fondo px-4 py-2 text-xs text-butter-muted hover:text-butter disabled:opacity-50">CANCELAR</button>
        <button type="button" disabled={ocupado} onClick={confirmar} className="rounded-lg bg-teal px-4 py-2 text-xs text-butter hover:bg-green disabled:opacity-50">ELIMINAR</button>
      </div>
    </dialog>
  )
}
