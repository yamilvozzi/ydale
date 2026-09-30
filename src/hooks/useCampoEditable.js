import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { actualizarTema } from '../lib/actualizarTema'

/**
 * Maneja el ciclo completo de un campo editable de la tabla `temas`:
 * lectura -> modo edición -> guardar.
 */
export function useCampoEditable({ temaId, campo, valor, onGuardado, serializarAlGuardar, bloqueado = false, onGuardandoChange }) {
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
    if (guardando || bloqueado) return
    setGuardando(true)
    onGuardandoChange?.(true)
    try {
      const valorAGuardar = serializarAlGuardar ? serializarAlGuardar(borrador) : borrador
      await actualizarTema(supabase, temaId, { [campo]: valorAGuardar })
      onGuardado(valorAGuardar)
      setEditando(false)
    } catch {
      alert('No se pudo guardar. Revisá la conexión e intentá de nuevo.')
    } finally {
      setGuardando(false)
      onGuardandoChange?.(false)
    }
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
