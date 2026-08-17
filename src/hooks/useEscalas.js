import { useCallback, useEffect, useState } from 'react'
import { normalizarEscala } from '../lib/escalas'
import { supabase } from '../lib/supabaseClient'

export function useEscalas(temaId) {
  const [escalas, setEscalas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    const { data, error: errorCarga } = await supabase
      .from('escalas')
      .select('id, tonica, tipo, orden')
      .eq('tema_id', temaId)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true })

    if (errorCarga) {
      setError(errorCarga)
    } else {
      setEscalas((data ?? []).map(normalizarEscala))
    }
    setCargando(false)
  }, [temaId])

  useEffect(() => {
    recargar()
  }, [recargar])

  async function guardarEscala(escala) {
    setGuardando(true)
    const datos = normalizarEscala(escala)
    let errorGuardado

    if (datos.id) {
      const { error } = await supabase
        .from('escalas')
        .update({ tonica: datos.tonica, tipo: datos.tipo })
        .eq('id', datos.id)
        .eq('tema_id', temaId)
      errorGuardado = error
    } else {
      const siguienteOrden = escalas.reduce(
        (mayor, actual) => Math.max(mayor, actual.orden),
        -1
      ) + 1
      const { error } = await supabase.from('escalas').insert({
        tema_id: temaId,
        tonica: datos.tonica,
        tipo: datos.tipo,
        orden: siguienteOrden,
      })
      errorGuardado = error
    }

    setGuardando(false)
    if (errorGuardado) {
      alert('No se pudo guardar la escala. Revisá la conexión e intentá de nuevo.')
      return false
    }

    await recargar()
    return true
  }

  async function eliminarEscala(escala) {
    setGuardando(true)
    const { error: errorEliminacion } = await supabase
      .from('escalas')
      .delete()
      .eq('id', escala.id)
      .eq('tema_id', temaId)
    setGuardando(false)

    if (errorEliminacion) {
      alert('No se pudo eliminar la escala. Revisá la conexión e intentá de nuevo.')
      return false
    }

    await recargar()
    return true
  }

  return { escalas, cargando, guardando, error, guardarEscala, eliminarEscala }
}

