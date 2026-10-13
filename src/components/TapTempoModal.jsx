import { RotateCcw, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { estimarBpm, medicionVacia, PAUSA_TAP_MS, registrarTap } from '../lib/tapTempo'

export default function TapTempoModal({ onCerrar }) {
  const dialogo = useRef(null)
  const botonTap = useRef(null)
  const temporizador = useRef(null)
  const actual = useRef(medicionVacia())
  const [medicion, setMedicion] = useState(actual.current)
  const id = useId()
  const bpm = estimarBpm(medicion.intervalos)

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    const modal = dialogo.current
    document.body.style.overflow = 'hidden'
    modal.showModal()
    botonTap.current.focus()
    return () => {
      clearTimeout(temporizador.current)
      modal.close()
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  function golpear() {
    const siguiente = registrarTap(actual.current, performance.now())
    if (siguiente === actual.current) return
    actual.current = siguiente
    setMedicion(siguiente)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      actual.current = { ...actual.current, finalizada: true }
      setMedicion(actual.current)
    }, PAUSA_TAP_MS)
  }

  function reiniciar() {
    clearTimeout(temporizador.current)
    actual.current = medicionVacia()
    setMedicion(actual.current)
    botonTap.current.focus()
  }

  return (
    <dialog ref={dialogo} aria-labelledby={`${id}-titulo`}
      onCancel={evento => { evento.preventDefault(); onCerrar() }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-xl border border-borde bg-superficie p-5 text-butter shadow-2xl backdrop:bg-black/70 sm:p-6"
    >
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 id={`${id}-titulo`} className="text-lg modal-titulo">Tap Tempo</h2>
        <button type="button" onClick={onCerrar} aria-label="Cerrar Tap Tempo" className="accion-icono rounded-lg text-butter-muted hover:bg-fondo hover:text-butter"><X size={20} /></button>
      </header>
      <p className="mb-6 text-center text-4xl tabular-nums" aria-live={medicion.finalizada ? 'polite' : 'off'} aria-atomic="true">BPM: {bpm ?? '—'}</p>
      <button ref={botonTap} type="button" aria-label="Marcar pulso"
        onPointerDown={evento => {
          if (!evento.isPrimary || evento.button !== 0) return
          golpear()
        }}
        // El puntero se registra al bajar. Sólo los clics de teclado o ayudas
        // técnicas (detail=0) pasan aquí, evitando el segundo evento móvil.
        onClick={evento => { if (evento.detail === 0) golpear() }}
        onKeyDown={evento => { if (evento.repeat && ['Enter', ' '].includes(evento.key)) evento.preventDefault() }}
        className="flex min-h-44 w-full touch-none select-none items-center justify-center rounded-xl bg-teal text-3xl tracking-widest hover:bg-green active:bg-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-butter"
      >TAP</button>
      <button type="button" onClick={reiniciar} disabled={!medicion.golpes} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-borde text-sm text-butter-muted hover:bg-fondo hover:text-butter disabled:opacity-40"><RotateCcw size={16} /> Reiniciar medición</button>
    </dialog>
  )
}
