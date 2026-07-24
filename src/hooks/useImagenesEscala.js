import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const BUCKET = 'escalas'

export function useImagenesEscala(temaId) {
  const [imagenes, setImagenes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)

  const recargar = useCallback(async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('imagenes_escala')
      .select('id, storage_path, orden')
      .eq('tema_id', temaId)
      .order('orden', { ascending: true })

    if (!error) {
      const conUrl = data.map((img) => ({
        ...img,
        url: supabase.storage.from(BUCKET).getPublicUrl(img.storage_path).data.publicUrl,
      }))
      setImagenes(conUrl)
    }
    setCargando(false)
  }, [temaId])

  useEffect(() => {
    recargar()
  }, [recargar])

  async function subirImagen(archivo) {
    setSubiendo(true)
    const extension = archivo.name.split('.').pop()
    const rutaArchivo = `${temaId}/${crypto.randomUUID()}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(rutaArchivo, archivo)

    if (errorSubida) {
      setSubiendo(false)
      alert('No se pudo subir la imagen. Probá de nuevo.')
      return
    }

    const { error: errorInsert } = await supabase.from('imagenes_escala').insert({
      tema_id: temaId,
      storage_path: rutaArchivo,
      orden: imagenes.length,
    })

    setSubiendo(false)

    if (errorInsert) {
      alert('La imagen se subió pero no se pudo guardar. Avisá si pasa de nuevo.')
      return
    }

    recargar()
  }

  async function eliminarImagen(imagen) {
    await supabase.storage.from(BUCKET).remove([imagen.storage_path])
    await supabase.from('imagenes_escala').delete().eq('id', imagen.id)
    recargar()
  }

  return { imagenes, cargando, subiendo, subirImagen, eliminarImagen }
}
