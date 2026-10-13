import { useEffect, useRef, useState } from 'react'
import { crearGestoAcorde } from '../lib/gestoAcorde'

export function useMoverAcorde({ contenedor, letra, habilitado, onMover }) {
  const opciones = useRef({ habilitado, onMover })
  opciones.current = { habilitado, onMover }
  const [arrastre, setArrastre] = useState(null)
  const control = useRef(null)
  if (!control.current) control.current = crearGestoAcorde({
    habilitado: () => opciones.current.habilitado,
    contenedor: () => contenedor.current,
    previsualizar: setArrastre,
    confirmar: (id, posicion) => opciones.current.onMover(id, posicion),
  })

  useEffect(() => {
    // Cancelar si cambia la letra, se guarda o se desmonta el componente.
    control.current.cancelar()
    return () => control.current.cancelar()
  }, [letra, habilitado])

  return { arrastre, eventos: control.current.eventos }
}
