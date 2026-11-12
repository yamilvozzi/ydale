import { useOutletContext } from 'react-router-dom'
import SeccionTextoEditable from '../SeccionTextoEditable'

export default function Letra() {
  const { tema, actualizarCampoLocal } = useOutletContext()

  return (
    <SeccionTextoEditable
      temaId={tema.id}
      campo="letra"
      valor={tema.letra}
      onGuardado={(v) => actualizarCampoLocal('letra', v)}
      textoGrande
      editorGrande
      claseLectura="mx-auto w-full max-w-2xl break-words text-left lg:max-w-5xl lg:columns-2 lg:gap-8"
      placeholder="Todavía no hay letra cargada. Tocá el lápiz para escribirla."
    />
  )
}
