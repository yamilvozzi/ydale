import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import AcordeDiagrama from '../AcordeDiagrama'
import EditorAcordeModal from '../EditorAcordeModal'
import SeccionTextoEditable from '../SeccionTextoEditable'
import { guardarNotas, leerNotas } from '../../lib/notasConAcordes'
import { supabase } from '../../lib/supabaseClient'

export default function Notas() {
  const { tema, actualizarCampoLocal } = useOutletContext()
  const notas = leerNotas(tema.notas)
  const [editor, setEditor] = useState(null)
  const [guardandoAcorde, setGuardandoAcorde] = useState(false)

  async function persistirAcordes(acordes) {
    setGuardandoAcorde(true)
    const valor = guardarNotas({ ...notas, acordes })
    const { error } = await supabase.from('temas').update({ notas: valor }).eq('id', tema.id)
    setGuardandoAcorde(false)

    if (error) {
      alert('No se pudo guardar el acorde. Revisá la conexión e intentá de nuevo.')
      return false
    }

    actualizarCampoLocal('notas', valor)
    return true
  }

  async function guardarAcorde(acorde) {
    const acordes = editor?.id
      ? notas.acordes.map((actual) => (actual.id === editor.id ? acorde : actual))
      : [...notas.acordes, acorde]

    if (await persistirAcordes(acordes)) setEditor(null)
  }

  async function eliminarAcorde(acorde) {
    if (!window.confirm(`¿Eliminar el acorde ${acorde.nombre || 'sin nombre'}?`)) return
    await persistirAcordes(notas.acordes.filter((actual) => actual.id !== acorde.id))
  }

  return (
    <div className="flex flex-col gap-6">
      <SeccionTextoEditable
        temaId={tema.id}
        campo="notas"
        valor={notas.texto}
        onGuardado={(valor) => actualizarCampoLocal('notas', valor)}
        serializarAlGuardar={(texto) => guardarNotas({ ...notas, texto })}
        titulo="Notas"
        placeholder="Entradas, finales, cambios, lo que vaya surgiendo en el ensayo."
      />

      <section className="border-t border-borde pt-5">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm uppercase tracking-widest text-butter-muted">Acordes</h2>
          <button
            type="button"
            onClick={() => setEditor({})}
            className="flex items-center gap-2 rounded-lg border border-borde bg-superficie px-3 py-2 text-sm text-butter transition-colors hover:border-teal hover:bg-fondo"
          >
            <Plus size={17} />
            Acorde
          </button>
        </div>

        {notas.acordes.length > 0 ? (
          <div className="flex flex-wrap items-start gap-3">
            {notas.acordes.map((acorde) => (
              <article key={acorde.id} className="w-fit max-w-full self-start rounded-lg border border-borde bg-superficie p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="min-w-0 truncate text-base text-butter">{acorde.nombre || 'Sin nombre'}</h3>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => setEditor(acorde)}
                      aria-label={`Editar ${acorde.nombre || 'acorde'}`}
                      className="rounded-lg p-2 text-butter-muted hover:bg-fondo hover:text-butter"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarAcorde(acorde)}
                      aria-label={`Eliminar ${acorde.nombre || 'acorde'}`}
                      className="rounded-lg p-2 text-butter-muted hover:bg-fondo hover:text-butter"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <AcordeDiagrama acorde={acorde} />
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-butter-muted">Todavía no hay diagramas cargados.</p>
        )}
      </section>

      {editor && (
        <EditorAcordeModal
          key={editor.id ?? 'nuevo'}
          acorde={editor.id ? editor : null}
          onCerrar={() => setEditor(null)}
          onGuardar={guardarAcorde}
          guardando={guardandoAcorde}
        />
      )}
    </div>
  )
}
