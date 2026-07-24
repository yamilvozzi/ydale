import { useOutletContext } from 'react-router-dom'
import SeccionTextoEditable from '../SeccionTextoEditable'

export default function Percusion() {
  const { tema, actualizarCampoLocal } = useOutletContext()

  return (
    <SeccionTextoEditable
      temaId={tema.id}
      campo="percusion"
      valor={tema.percusion}
      onGuardado={(v) => actualizarCampoLocal('percusion', v)}
      titulo="Percusión"
      placeholder="Todavía no hay nada acá. Reservado para Diego."
    />
  )
}
