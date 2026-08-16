import { useOutletContext } from 'react-router-dom'
import SeccionTextoEditable from '../SeccionTextoEditable'

export default function Estructura() {
  const { tema, actualizarCampoLocal } = useOutletContext()

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-2 gap-4">
        <SeccionTextoEditable
          temaId={tema.id}
          campo="tonalidad"
          valor={tema.tonalidad}
          onGuardado={(v) => actualizarCampoLocal('tonalidad', v)}
          titulo="Tonalidad"
          lineaUnica
          placeholder="Sin definir"
        />
        <SeccionTextoEditable
          temaId={tema.id}
          campo="escala_nombre"
          valor={tema.escala_nombre}
          onGuardado={(v) => actualizarCampoLocal('escala_nombre', v)}
          titulo="Escala"
          lineaUnica
          placeholder="Sin definir"
        />
      </div>

      <div className="flex-1 min-h-0">
        <SeccionTextoEditable
          temaId={tema.id}
          campo="estructura"
          valor={tema.estructura}
          onGuardado={(v) => actualizarCampoLocal('estructura', v)}
          titulo="Machete de acordes"
          fuenteMono
          editorGrande
          placeholder={'Todavía no hay estructura cargada.\nEj:\nINTRO\nDm Bb F C'}
        />
      </div>
    </div>
  )
}
