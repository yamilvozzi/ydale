import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Maneja el ciclo completo de un campo editable de la tabla `temas`:
 * lectura -> modo edición -> guardar.
 */
export function useCampoEditable({ temaId, campo, valor, onGuardado, serializarAlGuardar }) {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState('')
  const [guardando, setGuardando] = useState(false)

  function empezarEdicion() {
    setBorrador(valor ?? '')
    setEditando(true)
  }

  function cancelar() {
    setEditando(false)
  }

  async function guardar() {
    setGuardando(true)
    const valorAGuardar = serializarAlGuardar ? serializarAlGuardar(borrador) : borrador
    const { error } = await supabase
      .from('temas')
      .update({ [campo]: valorAGuardar })
      .eq('id', temaId)

    setGuardando(false)

    if (error) {
      alert('No se pudo guardar. Revisá la conexión e intentá de nuevo.')
      return
    }

    onGuardado(valorAGuardar)
    setEditando(false)
  }

  return {
    editando,
    borrador,
    setBorrador,
    guardando,
    empezarEdicion,
    cancelar,
    guardar,
  }
}
