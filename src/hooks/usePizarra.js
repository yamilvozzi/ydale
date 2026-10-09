import { useState } from 'react'
import { leerPizarra, guardarPizarra, pizarraVacia, ponerElemento } from '../lib/pizarra'
import { reordenarGrupo } from '../lib/ordenTarjetas'

export function usePizarra() {
  const [estado, setEstado] = useState(() => {
    try {
      return { datos: leerPizarra(window.localStorage), error: '', lecturaFallida: false }
    } catch {
      return { datos: pizarraVacia(), error: 'No se pudo leer la pizarra guardada en este dispositivo.', lecturaFallida: true }
    }
  })

  function persistir(datos) {
    try {
      guardarPizarra(window.localStorage, datos)
      setEstado({ datos, error: '', lecturaFallida: false })
      return true
    } catch {
      setEstado((actual) => ({ ...actual, error: 'No se pudo guardar la pizarra en este dispositivo. Revisá el almacenamiento e intentá de nuevo.' }))
      return false
    }
  }

  return {
    elementos: estado.datos.elementos,
    error: estado.error,
    lecturaFallida: estado.lecturaFallida,
    guardar: (tipo, datos) => !estado.lecturaFallida && persistir(ponerElemento(estado.datos, tipo, datos)),
    reordenar: (tipo, ordenados) => !estado.lecturaFallida && persistir({ ...estado.datos, elementos: reordenarGrupo(estado.datos.elementos, tipo, ordenados) }),
    eliminar: (id) => persistir({ ...estado.datos, elementos: estado.datos.elementos.filter((elemento) => elemento.datos.id !== id) }),
    vaciar: () => persistir(pizarraVacia()),
  }
}
