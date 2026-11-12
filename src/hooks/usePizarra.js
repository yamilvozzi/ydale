import { useEffect, useRef, useState } from 'react'
import { pizarraVacia, ponerElemento, transponerPizarra, desplazamientoPizarra, reiniciarTransposicionPizarra } from '../lib/pizarra'
import { cambiosPizarra, guardarTrabajoPizarra, leerTrabajoPizarra, repositorioPizarras } from '../lib/proyectosPizarra'
import { reordenarGrupo } from '../lib/ordenTarjetas'
import { copiarMusicaAPizarra } from '../lib/musicaRepertorio'
import { supabase } from '../lib/supabaseClient'

export const pizarrasDB = repositorioPizarras(supabase)

export function usePizarra() {
  const vigente = useRef(true)
  const [estado, setEstado] = useState(() => {
    try {
      return { ...leerTrabajoPizarra(window.localStorage), error: '', lecturaFallida: false }
    } catch {
      return { datos: pizarraVacia(), proyecto: null, error: 'No se pudo leer la pizarra guardada en este dispositivo.', lecturaFallida: true }
    }
  })

  useEffect(() => {
    vigente.current = true
    return () => { vigente.current = false }
  }, [])

  function persistir(datos, proyecto = estado.proyecto, cambioEnBiblioteca = false) {
    if (!vigente.current) return false
    try {
      guardarTrabajoPizarra(window.localStorage, datos, proyecto)
      setEstado({ datos, proyecto, error: '', lecturaFallida: false })
      return true
    } catch {
      if (cambioEnBiblioteca) {
        setEstado({ datos, proyecto, lecturaFallida: false, error: 'Se actualizó la biblioteca, pero no se pudo actualizar el borrador local de este dispositivo.' })
        return true
      }
      setEstado(actual => ({ ...actual, error: 'No se pudo guardar la pizarra en este dispositivo. Revisá el almacenamiento e intentá de nuevo.' }))
      return false
    }
  }

  function aplicarTransposicion(transformar) {
    if (estado.lecturaFallida) return false
    try {
      return persistir(transformar(estado.datos))
    } catch (error) {
      setEstado(actual => ({ ...actual, error: error.message }))
      return false
    }
  }

  function cargarTema(musica) {
    if (estado.lecturaFallida) return false
    try {
      return persistir(copiarMusicaAPizarra(musica), null)
    } catch (error) {
      setEstado(actual => ({ ...actual, error: error.message }))
      return false
    }
  }

  return {
    datos: estado.datos,
    proyecto: estado.proyecto,
    pendiente: cambiosPizarra(estado.datos, estado.proyecto),
    elementos: estado.datos.elementos,
    error: estado.error,
    lecturaFallida: estado.lecturaFallida,
    transponer: semitonos => aplicarTransposicion(datos => transponerPizarra(datos, semitonos)),
    desplazamiento: desplazamientoPizarra(estado.datos),
    reiniciarTransposicion: () => aplicarTransposicion(reiniciarTransposicionPizarra),
    cargarTema,
    guardar: (tipo, datos) => !estado.lecturaFallida && persistir(ponerElemento(estado.datos, tipo, datos)),
    reordenar: (tipo, ordenados) => !estado.lecturaFallida && persistir({ ...estado.datos, elementos: reordenarGrupo(estado.datos.elementos, tipo, ordenados) }),
    eliminar: (id) => persistir({ ...estado.datos, elementos: estado.datos.elementos.filter((elemento) => elemento.datos.id !== id) }),
    vaciar: () => persistir(pizarraVacia(), null),
    abrirProyecto: ({ contenido, ...proyecto }) => persistir(contenido, { ...proyecto, base: contenido }),
    confirmarGuardado: proyecto => persistir(estado.datos, { ...proyecto, base: estado.datos }, true),
    renombrarProyecto: (original, nuevo) => {
      if (original.id === estado.proyecto?.id && original.revision === estado.proyecto.revision) {
        persistir(estado.datos, { ...nuevo, base: estado.proyecto.base }, true)
      }
    },
    desvincularProyecto: id => {
      if (id === estado.proyecto?.id) persistir(estado.datos, null, true)
    },
  }
}
