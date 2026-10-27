import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { mensajeErrorSetlists, repositorioSetlists } from '../lib/setlists'

export const setlistsDB = repositorioSetlists(supabase)

export function useSetlists(id) {
  const [datos, setDatos] = useState(id ? null : [])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const solicitud = useRef(0)
  const recargar = useCallback(async () => {
    const numero = ++solicitud.current
    setCargando(true)
    setError('')
    try {
      const datos = id ? await setlistsDB.leer(id) : await setlistsDB.listar()
      if (numero === solicitud.current) setDatos(datos)
    } catch (error) {
      if (numero === solicitud.current) setError(mensajeErrorSetlists(error))
    } finally {
      if (numero === solicitud.current) setCargando(false)
    }
  }, [id])
  useEffect(() => {
    recargar()
    // Contador de solicitudes, no referencia a un nodo del DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { solicitud.current++ }
  }, [recargar])
  return { datos, setDatos, cargando, error, recargar }
}
