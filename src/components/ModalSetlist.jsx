import { useEffect, useId, useRef, useState } from 'react'
import { mensajeErrorSetlists } from '../lib/setlists'

export default function ModalSetlist({ original, onCerrar, onGuardar }) {
  const dialogo = useRef(null)
  const bloqueo = useRef(false)
  const id = useId()
  const [title, setTitle] = useState(original?.title ?? '')
  const [date, setDate] = useState(original?.date ?? '')
  const [place, setPlace] = useState(original?.place ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogo.current.showModal()
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  async function guardar(evento) {
    evento.preventDefault()
    if (bloqueo.current || !title.trim() || !date) return
    bloqueo.current = true
    setGuardando(true)
    setError('')
    try {
      await onGuardar({ title, date, place })
    } catch (error) {
      setError(mensajeErrorSetlists(error))
    } finally {
      bloqueo.current = false
      setGuardando(false)
    }
  }

  const campo = 'w-full min-w-0 bg-fondo border border-borde rounded-lg p-3 text-base normal-case tracking-normal text-butter focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30'
  return <dialog ref={dialogo} aria-labelledby={`${id}-titulo`} aria-busy={guardando}
    onCancel={e => { e.preventDefault(); if (!bloqueo.current) onCerrar() }}
    className="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-sm overflow-y-auto rounded-xl border border-borde bg-superficie p-5 text-butter shadow-2xl backdrop:bg-black/70">
    <form onSubmit={guardar} className="flex flex-col gap-4">
      <h2 id={`${id}-titulo`} className="text-lg modal-titulo">{original ? 'Duplicar setlist' : 'Nuevo setlist'}</h2>
      <label className="flex flex-col gap-1 text-xs text-butter-muted uppercase tracking-wide">Título
        <input autoFocus required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} className={campo} disabled={guardando} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-butter-muted uppercase tracking-wide">Fecha
        <input required type="date" value={date} onChange={e => setDate(e.target.value)} className={campo} disabled={guardando} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-butter-muted uppercase tracking-wide">Lugar (opcional)
        <input maxLength={300} value={place} onChange={e => setPlace(e.target.value)} className={campo} disabled={guardando} />
      </label>
      {error && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
      <div className="flex gap-2 justify-end mt-2">
        <button type="button" disabled={guardando} onClick={onCerrar} className="px-4 py-2 rounded-lg text-butter-muted hover:bg-fondo disabled:opacity-50">CANCELAR</button>
        <button type="submit" disabled={guardando || !title.trim() || !date} className="px-4 py-2 rounded-lg bg-teal hover:bg-green text-butter disabled:opacity-50">{guardando ? 'Guardando…' : original ? 'DUPLICAR' : 'CREAR'}</button>
      </div>
    </form>
  </dialog>
}
