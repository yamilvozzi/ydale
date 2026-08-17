import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import EditorEscalaModal from '../EditorEscalaModal'
import EscalaDiagrama from '../EscalaDiagrama'
import { useEscalas } from '../../hooks/useEscalas'
import { etiquetaTipo } from '../../lib/escalas'

export default function Escala() {
  const { tema } = useOutletContext()
  const { escalas, cargando, guardando, error, guardarEscala, eliminarEscala } =
    useEscalas(tema.id)
  const [editor, setEditor] = useState(null)

  async function alGuardar(escala) {
    if (await guardarEscala(escala)) setEditor(null)
  }

  async function alEliminar(escala) {
    const nombre = `${escala.tonica} ${etiquetaTipo(escala.tipo)}`
    if (!window.confirm(`¿Eliminar la escala ${nombre}?`)) return
    await eliminarEscala(escala)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm tracking-widest text-butter-muted uppercase mb-1">
          Referencia
        </h2>
        <p className="text-butter">
          {tema.tonalidad || 'Sin definir'} · {tema.escala_nombre || 'Sin definir'}
        </p>
      </div>

      <section className="flex flex-col gap-4 border-t border-borde pt-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm uppercase tracking-widest text-butter-muted">Escalas</h2>
          <button
            type="button"
            onClick={() => setEditor({})}
            className="flex items-center gap-2 rounded-lg border border-borde bg-superficie px-3 py-2 text-sm text-butter transition-colors hover:border-teal hover:bg-fondo"
          >
            <Plus size={17} />
            Escala
          </button>
        </div>

        {cargando ? (
          <p className="text-butter-muted">Cargando…</p>
        ) : error ? (
          <p className="rounded-lg border border-borde bg-superficie p-4 text-sm text-butter-muted">
            No se pudieron cargar las escalas. Verificá la conexión y que la migración esté aplicada.
          </p>
        ) : escalas.length > 0 ? (
          escalas.map((escala) => (
            <article
              key={escala.id}
              className="rounded-lg border border-borde bg-superficie p-3 sm:p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="min-w-0 truncate text-base text-butter sm:text-lg">
                  {escala.tonica} · {etiquetaTipo(escala.tipo)}
                </h3>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditor(escala)}
                    aria-label={`Editar escala ${escala.tonica} ${etiquetaTipo(escala.tipo)}`}
                    className="rounded-lg p-2 text-butter-muted hover:bg-fondo hover:text-butter"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => alEliminar(escala)}
                    disabled={guardando}
                    aria-label={`Eliminar escala ${escala.tonica} ${etiquetaTipo(escala.tipo)}`}
                    className="rounded-lg p-2 text-butter-muted hover:bg-fondo hover:text-butter disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto pb-2">
                <EscalaDiagrama escala={escala} />
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm italic text-butter-muted">Todavía no hay escalas cargadas.</p>
        )}
      </section>

      {editor && (
        <EditorEscalaModal
          key={editor.id ?? 'nueva'}
          escala={editor.id ? editor : null}
          onCerrar={() => setEditor(null)}
          onGuardar={alGuardar}
          guardando={guardando}
        />
      )}
    </div>
  )
}
