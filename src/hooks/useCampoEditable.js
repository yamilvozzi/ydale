import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const VENTANA_DESHACER_MS = 6000

/**
 * Maneja el ciclo completo de un campo editable de la tabla `temas`:
 * lectura -> modo edición -> guardar -> ventana breve para deshacer.
 *
 * No hay historial de versiones: un único nivel de "deshacer último
 * guardado" alcanza para el caso de uso real (una persona editando,
 * de a un cambio por vez).
 */
export function useCampoEditable({ temaId, campo, valor, onGuardado }) {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [puedeDeshacer, setPuedeDeshacer] = useState(false)

  const valorAntesDeEditar = useRef(valor)
  const timeoutDeshacer = useRef(null)

  function empezarEdicion() {
    valorAntesDeEditar.current = valor
    setBorrador(valor ?? '')
    setEditando(true)
  }

  function cancelar() {
    setEditando(false)
  }

  async function guardar() {
    setGuardando(true)
    const { error } = await supabase
      .from('temas')
      .update({ [campo]: borrador })
      .eq('id', temaId)

    setGuardando(false)

    if (error) {
      alert('No se pudo guardar. Revisá la conexión e intentá de nuevo.')
      return
    }

    onGuardado(borrador)
    setEditando(false)
    abrirVentanaDeshacer()
  }

  function abrirVentanaDeshacer() {
    setPuedeDeshacer(true)
    clearTimeout(timeoutDeshacer.current)
    timeoutDeshacer.current = setTimeout(() => setPuedeDeshacer(false), VENTANA_DESHACER_MS)
  }

  async function deshacer() {
    const anterior = valorAntesDeEditar.current
    setPuedeDeshacer(false)
    clearTimeout(timeoutDeshacer.current)

    const { error } = await supabase
      .from('temas')
      .update({ [campo]: anterior })
      .eq('id', temaId)

    if (!error) onGuardado(anterior)
  }

  return {
    editando,
    borrador,
    setBorrador,
    guardando,
    puedeDeshacer,
    empezarEdicion,
    cancelar,
    guardar,
    deshacer,
  }
}
