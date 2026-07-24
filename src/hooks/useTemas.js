import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useTemas() {
  const [temas, setTemas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('temas')
      .select('id, nombre, artista')
      .order('nombre', { ascending: true })

    if (error) setError(error)
    else setTemas(data)
    setCargando(false)
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  return { temas, cargando, error, recargar }
}
