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
      titulo="Letra"
      textoGrande
      placeholder="Todavía no hay letra cargada. Tocá el lápiz para escribirla."
    />
  )
}
