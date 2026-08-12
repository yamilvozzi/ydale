import { Check, X } from 'lucide-react'
import { useState } from 'react'
import AcordeDiagrama from './AcordeDiagrama'
import { crearAcorde, normalizarAcorde } from '../lib/notasConAcordes'

export default function EditorAcordeModal({ acorde, onCerrar, onGuardar, guardando = false }) {
  const [borrador, setBorrador] = useState(() => normalizarAcorde(acorde ?? crearAcorde()))

  function enviar(e) {
    e.preventDefault()
    onGuardar({ ...borrador, nombre: borrador.nombre.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
      <form
        onSubmit={enviar}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-y-auto rounded-xl border border-borde bg-superficie p-4 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg text-butter">{acorde ? 'Editar acorde' : 'Nuevo acorde'}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar editor de acorde"
            className="rounded-lg p-2 text-butter-muted hover:bg-fondo hover:text-butter"
          >
            <X size={20} />
          </button>
        </div>

        <label className="mb-5 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-butter-muted">Nombre o nota</span>
          <input
            autoFocus
            value={borrador.nombre}
            onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
            placeholder="C, Am, C/E, G7, Fmaj7…"
            className="rounded-lg border border-borde bg-fondo p-3 text-butter placeholder:text-butter-muted focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
          />
        </label>

        <div className="rounded-lg border border-borde bg-fondo/40 p-3 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-wide text-butter-muted">Diapasón</p>
            <p className="text-xs text-butter-muted">Tocá una posición: vacío → pisada → al aire → X.</p>
          </div>
          <AcordeDiagrama acorde={borrador} editable onChange={setBorrador} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCerrar}
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
    </div>
  )
}
