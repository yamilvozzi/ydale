import { Pencil, Plus, Trash2, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import AcordeDiagrama from '../AcordeDiagrama'
import EditorAcordeModal from '../EditorAcordeModal'
import GeneradorAcordesModal from '../GeneradorAcordesModal'
import SeccionTextoEditable from '../SeccionTextoEditable'
import { guardarNotas, leerNotas } from '../../lib/notasConAcordes'
import { supabase } from '../../lib/supabaseClient'
import { actualizarTema } from '../../lib/actualizarTema'

export default function Notas() {
  const { tema, actualizarCampoLocal } = useOutletContext()
  const notas = leerNotas(tema.notas)
  const [editor, setEditor] = useState(null)
  const [generadorAbierto, setGeneradorAbierto] = useState(false)
  const [guardandoAcorde, setGuardandoAcorde] = useState(false)
  const [guardandoTexto, setGuardandoTexto] = useState(false)
  const ocupado = guardandoAcorde || guardandoTexto

  async function persistirAcordes(acordes) {
    if (ocupado) return false
    setGuardandoAcorde(true)
    try {
      const valor = guardarNotas({ ...notas, acordes })
      await actualizarTema(supabase, tema.id, { notas: valor })
      actualizarCampoLocal('notas', valor)
      return true
    } catch {
      alert('No se pudo guardar el acorde. Revisá la conexión e intentá de nuevo.')
      return false
    } finally {
      setGuardandoAcorde(false)
    }
  }

  async function guardarAcorde(acorde) {
    const acordes = editor?.id && !editor.esNuevo
      ? notas.acordes.map((actual) => (actual.id === editor.id ? acorde : actual))
      : [...notas.acordes, acorde]

    if (await persistirAcordes(acordes)) setEditor(null)
  }

  async function eliminarAcorde(acorde) {
    if (ocupado) return
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
        bloqueado={guardandoAcorde}
        onGuardandoChange={setGuardandoTexto}
        titulo="Notas"
        editorGrande
        placeholder="Entradas, finales, cambios, lo que vaya surgiendo en el ensayo."
      />

      <section className="border-t border-borde pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm uppercase tracking-widest text-butter-muted">Acordes</h2>
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGeneradorAbierto(true)}
            disabled={ocupado}
            className="flex items-center gap-2 rounded-lg border border-teal bg-teal px-3 py-2 text-sm text-butter transition-colors hover:bg-green"
          >
            <WandSparkles size={17} />
            Generador
          </button>
          <button
            type="button"
            onClick={() => setEditor({})}
            disabled={ocupado}
            className="flex items-center gap-2 rounded-lg border border-borde bg-superficie px-3 py-2 text-sm text-butter transition-colors hover:border-teal hover:bg-fondo"
          >
            <Plus size={17} />
            Acorde
          </button>
          </div>
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
                      disabled={ocupado}
                      aria-label={`Editar ${acorde.nombre || 'acorde'}`}
                      className="accion-icono rounded-lg text-butter-muted hover:bg-fondo hover:text-butter"
                    >
                      <Pencil />
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarAcorde(acorde)}
                      disabled={ocupado}
                      aria-label={`Eliminar ${acorde.nombre || 'acorde'}`}
                      className="accion-icono rounded-lg text-butter-muted hover:bg-fondo hover:text-butter"
                    >
                      <Trash2 />
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

      {generadorAbierto && <GeneradorAcordesModal
        onCerrar={() => setGeneradorAbierto(false)}
        onElegir={(acorde) => {
          setGeneradorAbierto(false)
          setEditor({ ...acorde, esNuevo: true })
        }}
      />}

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
