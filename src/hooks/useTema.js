import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useTema(id) {
  const [tema, setTema] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('temas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) setError(error)
    else setTema(data)
    setCargando(false)
  }, [id])

  useEffect(() => {
    recargar()
  }, [recargar])

  // Actualiza el estado local sin refetch: lo usan las secciones
  // editables después de guardar, para que se vea al instante.
  const actualizarCampoLocal = useCallback((campo, valor) => {
    setTema((actual) => (actual ? { ...actual, [campo]: valor } : actual))
  }, [])

  return { tema, cargando, error, recargar, actualizarCampoLocal }
}
