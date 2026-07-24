import { useOutletContext } from 'react-router-dom'
import SeccionTextoEditable from '../SeccionTextoEditable'

export default function Notas() {
  const { tema, actualizarCampoLocal } = useOutletContext()

  return (
    <SeccionTextoEditable
      temaId={tema.id}
      campo="notas"
      valor={tema.notas}
      onGuardado={(v) => actualizarCampoLocal('notas', v)}
      titulo="Notas"
      placeholder="Entradas, finales, cambios, lo que vaya surgiendo en el ensayo."
    />
  )
}
