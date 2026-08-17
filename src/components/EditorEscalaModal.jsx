import { Check, X } from 'lucide-react'
import { useState } from 'react'
import EscalaDiagrama from './EscalaDiagrama'
import { crearEscala, normalizarEscala, NOTAS, TIPOS_ESCALA } from '../lib/escalas'

export default function EditorEscalaModal({ escala, onCerrar, onGuardar, guardando = false }) {
  const [borrador, setBorrador] = useState(() =>
    normalizarEscala(escala ?? crearEscala())
  )

  function enviar(e) {
    e.preventDefault()
    onGuardar(borrador)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6">
      <form
        onSubmit={enviar}
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl flex-col overflow-y-auto rounded-xl border border-borde bg-superficie p-4 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg text-butter">{escala ? 'Editar escala' : 'Nueva escala'}</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar editor de escala"
            className="rounded-lg p-2 text-butter-muted hover:bg-fondo hover:text-butter"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 grid gap-5 lg:grid-cols-[2fr_1fr]">
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-wide text-butter-muted">
              Tónica
            </legend>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
              {NOTAS.map((nota) => {
                const seleccionada = borrador.tonica === nota
                return (
                  <button
                    key={nota}
                    type="button"
                    autoFocus={seleccionada}
                    aria-pressed={seleccionada}
                    onClick={() => setBorrador({ ...borrador, tonica: nota })}
                    className={`rounded-lg border px-2 py-2.5 text-sm transition-colors ${
                      seleccionada
                        ? 'border-teal bg-teal text-butter'
                        : 'border-borde bg-fondo text-butter-muted hover:border-teal hover:text-butter'
                    }`}
                  >
                    {nota}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-wide text-butter-muted">
              Tipo
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_ESCALA.map((tipo) => {
                const seleccionado = borrador.tipo === tipo.valor
                return (
                  <button
                    key={tipo.valor}
                    type="button"
                    aria-pressed={seleccionado}
                    onClick={() => setBorrador({ ...borrador, tipo: tipo.valor })}
                    className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      seleccionado
                        ? 'border-teal bg-teal text-butter'
                        : 'border-borde bg-fondo text-butter-muted hover:border-teal hover:text-butter'
                    }`}
                  >
                    {tipo.etiqueta}
                  </button>
                )
              })}
            </div>
          </fieldset>
        </div>

        <div className="rounded-lg border border-borde bg-fondo/40 p-3 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-butter-muted">Vista previa</p>
            <p className="text-sm text-butter">
              {borrador.tonica} · {TIPOS_ESCALA.find((tipo) => tipo.valor === borrador.tipo)?.etiqueta}
            </p>
          </div>
          <div className="overflow-x-auto pb-2">
            <EscalaDiagrama escala={borrador} />
          </div>
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
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
