import { Check, CircleDot, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import AcordeDiagrama from './AcordeDiagrama'
import { crearAcorde, normalizarAcorde } from '../lib/notasConAcordes'

export default function EditorAcordeModal({ acorde, onCerrar, onGuardar, guardando = false }) {
  const [borrador, setBorrador] = useState(() => normalizarAcorde(acorde ?? crearAcorde()))
  const [seleccionandoTonica, setSeleccionandoTonica] = useState(false)
  const dialogo = useRef(null)
  const nombre = useRef(null)
  const tituloId = useId()

  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogo.current.showModal()
    nombre.current.focus()
    return () => {
      document.body.style.overflow = overflow
      if (anterior?.isConnected) anterior.focus()
    }
  }, [])

  function enviar(e) {
    e.preventDefault()
    onGuardar({ ...borrador, nombre: borrador.nombre.trim() })
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={tituloId}
      onCancel={(evento) => { evento.preventDefault(); if (!guardando) onCerrar() }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto rounded-xl border border-borde bg-superficie p-4 text-butter shadow-2xl backdrop:bg-black/70 sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:p-6"
    >
      <form
        onSubmit={enviar}
        className="flex flex-col"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id={tituloId} className="text-lg text-butter">{acorde && !acorde.esNuevo ? 'Editar acorde' : 'Nuevo acorde'}</h2>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar editor de acorde"
            className="rounded-lg p-2 text-butter-muted hover:bg-fondo hover:text-butter"
          >
            <X size={20} />
          </button>
        </div>

        <fieldset disabled={guardando} className="min-w-0">
        <label className="mb-5 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-butter-muted">Nombre o nota</span>
          <input
            ref={nombre}
            value={borrador.nombre}
            onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
            placeholder="C, Am, C/E, G7, Fmaj7…"
            className="rounded-lg border border-borde bg-fondo p-3 text-butter placeholder:text-butter-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
          />
        </label>

        <div className="rounded-lg border border-borde bg-fondo/40 p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-butter-muted">Diapasón</p>
            <button
              type="button"
              aria-pressed={seleccionandoTonica}
              onClick={() => setSeleccionandoTonica((actual) => !actual)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${seleccionandoTonica ? 'border-butter bg-butter text-fondo' : 'border-borde text-butter-muted hover:border-teal hover:text-butter'}`}
            >
              <CircleDot size={16} />
              Marcar tónica
            </button>
          </div>
          <div className="overflow-x-auto px-1 pb-2 pt-2">
            <AcordeDiagrama
              acorde={borrador}
              editable
              onChange={(valor) => setBorrador(normalizarAcorde(valor))}
              modoTonica={seleccionandoTonica}
              onTonicaSeleccionada={() => setSeleccionandoTonica(false)}
            />
          </div>
        </div>

        </fieldset>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-lg px-4 py-2 text-butter-muted hover:bg-fondo"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-butter transition-colors hover:bg-green disabled:opacity-50"
          >
            <Check size={18} />
            Guardar
          </button>
        </div>
      </form>
    </dialog>
  )
}
