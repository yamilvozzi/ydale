import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import EditorEscalaModal from '../EditorEscalaModal'
import TarjetasOrdenables from '../TarjetasOrdenables'
import ConfirmarEliminacionModal from '../ConfirmarEliminacionModal'
import { useEscalas } from '../../hooks/useEscalas'
import { etiquetaTipo } from '../../lib/escalas'

export default function Escala() {
  const { tema } = useOutletContext()
  const { escalas, cargando, guardando, error, guardarEscala, eliminarEscala, reordenarEscalas } =
    useEscalas(tema.id)
  const [editor, setEditor] = useState(null)
  const [escalaAEliminar, setEscalaAEliminar] = useState(null)

  async function alGuardar(escala) {
    if (await guardarEscala(escala)) setEditor(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setEditor({})}
            disabled={guardando}
            className="boton-funcion flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
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
          <TarjetasOrdenables
            tipo="escala"
            items={escalas}
            disabled={guardando}
            onReordenar={reordenarEscalas}
            onEditar={setEditor}
            onEliminar={setEscalaAEliminar}
          />
        ) : (
          <p className="text-sm italic text-butter-muted">Todavía no hay escalas cargadas.</p>
        )}
      </section>

      {escalaAEliminar && <ConfirmarEliminacionModal
        mensaje={`¿Eliminar la escala ${escalaAEliminar.tonica} ${etiquetaTipo(escalaAEliminar.tipo)}?`}
        onCancelar={() => setEscalaAEliminar(null)}
        onConfirmar={() => eliminarEscala(escalaAEliminar)}
      />}

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
