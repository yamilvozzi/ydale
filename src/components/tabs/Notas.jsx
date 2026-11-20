import { Plus, WandSparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import AcordesRepertorio from '../AcordesRepertorio'
import EditorAcordeModal from '../EditorAcordeModal'
import GeneradorAcordesModal from '../GeneradorAcordesModal'
import ConfirmarEliminacionModal from '../ConfirmarEliminacionModal'
import SeccionTextoEditable from '../SeccionTextoEditable'
import { guardarNotas, leerNotas } from '../../lib/notasConAcordes'
import { supabase } from '../../lib/supabaseClient'
import { actualizarTema } from '../../lib/actualizarTema'

export default function Notas() {
  const { tema, actualizarCampoLocal } = useOutletContext()
  const notas = leerNotas(tema.notas)
  const [editor, setEditor] = useState(null)
  const [generadorAbierto, setGeneradorAbierto] = useState(false)
  const [acordeAEliminar, setAcordeAEliminar] = useState(null)
  const [guardandoAcorde, setGuardandoAcorde] = useState(false)
  const [guardandoTexto, setGuardandoTexto] = useState(false)
  const [modalBloque, setModalBloque] = useState(null)
  const [error, setError] = useState('')
  const envio = useRef(false)
  const ocupado = guardandoAcorde || guardandoTexto

  async function persistirNotas(datos, mostrarError = true) {
    if (ocupado || envio.current) return false
    envio.current = true
    setGuardandoAcorde(true)
    setError('')
    try {
      const valor = guardarNotas(datos)
      await actualizarTema(supabase, tema.id, { notas: valor })
      actualizarCampoLocal('notas', valor)
      return true
    } catch {
      setError('No se pudo guardar la organización de acordes. Revisá la conexión e intentá de nuevo.')
      if (mostrarError) alert('No se pudo guardar el acorde. Revisá la conexión e intentá de nuevo.')
      return false
    } finally {
      envio.current = false
      setGuardandoAcorde(false)
    }
  }

  const persistirAcordes = (acordes, mostrarError = true) => persistirNotas({ ...notas, acordes }, mostrarError)

  async function guardarAcorde(acorde) {
    const acordes = editor?.id && !editor.esNuevo
      ? notas.acordes.map((actual) => (actual.id === editor.id ? acorde : actual))
      : [...notas.acordes, acorde]

    if (await persistirAcordes(acordes)) setEditor(null)
  }

  async function eliminarAcorde(acorde) {
    return persistirAcordes(notas.acordes.filter((actual) => actual.id !== acorde.id), false)
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="columna-encabezado mb-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setGeneradorAbierto(true)}
            disabled={ocupado}
            className="boton-funcion flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          >
            <WandSparkles size={17} />
            Generador
          </button>
          <button
            type="button"
            onClick={() => setEditor({})}
            disabled={ocupado}
            className="boton-funcion flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          >
            <Plus size={17} />
            Acorde
          </button>
          <button type="button" onClick={() => setModalBloque({ tipo: 'crear' })} disabled={ocupado}
            className="boton-funcion flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <Plus size={17} /> Bloque
          </button>
        </div>

        {error && <p role="alert" className="mb-3 text-sm text-butter-muted">{error}</p>}
        <AcordesRepertorio notas={notas} disabled={ocupado} error={error}
          onGuardar={datos => persistirNotas(datos, false)} onEditar={setEditor} onEliminar={setAcordeAEliminar}
          modal={modalBloque} setModal={setModalBloque} />
      </section>

      <div className="border-t border-borde pt-5">
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
          columnas
          placeholder="Entradas, finales, cambios, lo que vaya surgiendo en el ensayo."
        />
      </div>

      {acordeAEliminar && <ConfirmarEliminacionModal
        mensaje={`¿Eliminar el acorde ${acordeAEliminar.nombre || 'sin nombre'}?`}
        onCancelar={() => setAcordeAEliminar(null)}
        onConfirmar={() => eliminarAcorde(acordeAEliminar)}
      />}

      {generadorAbierto && <GeneradorAcordesModal
        onCerrar={() => setGeneradorAbierto(false)}
        guardando={ocupado}
        onElegir={async (acorde) => {
          if (await persistirAcordes([...notas.acordes, acorde])) setGeneradorAbierto(false)
        }}
        onEditar={(acorde) => {
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
