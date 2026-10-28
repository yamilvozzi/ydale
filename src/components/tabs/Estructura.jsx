import { Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import EditorEstructuraModal from '../EditorEstructuraModal'
import LetraConAcordes from '../LetraConAcordes'
import { leerNotas } from '../../lib/notasConAcordes'
import { useEscalas } from '../../hooks/useEscalas'
import { estructuraVacia, guardarEstructuraTema, leerEstructura, nombreBloque, referenciaEstructura } from '../../lib/estructura'
import { supabase } from '../../lib/supabaseClient'

export default function Estructura() {
  const { tema, actualizarCampoLocal } = useOutletContext()
  const { escalas } = useEscalas(tema.id)
  const [editorAbierto, setEditorAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const lectura = useMemo(() => {
    try { return { datos: leerEstructura(tema.estructura), error: '' } }
    catch { return { datos: estructuraVacia(), error: 'La estructura guardada no tiene un formato compatible. Podés reemplazarla desde el editor.' } }
  }, [tema.estructura])
  const referencia = referenciaEstructura(escalas)
  const acordes = useMemo(() => leerNotas(tema.notas).acordes, [tema.notas])

  async function guardar(estructura) {
    setGuardando(true)
    setErrorGuardado('')
    try {
      const valor = await guardarEstructuraTema(supabase, tema.id, estructura)
      actualizarCampoLocal('estructura', valor)
      setEditorAbierto(false)
    } catch {
      setErrorGuardado('No se pudo guardar la estructura. Revisá la conexión e intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-borde pb-4">
        {referencia && <p aria-label="Referencia musical del tema" className="text-sm text-butter">{referencia}</p>}
        <button type="button" onClick={() => { setErrorGuardado(''); setEditorAbierto(true) }} className="boton-funcion ml-auto flex items-center gap-2 rounded-lg px-3 text-xs tracking-wide"><Pencil size={16} /> EDITAR ESTRUCTURA</button>
      </header>
      {lectura.error && <p role="alert" className="mb-3 text-sm text-butter-muted">{lectura.error}</p>}
      {!lectura.datos.bloques.length && <p className="text-sm text-butter-muted">Todavía no hay estructura cargada.</p>}
      <ol aria-label="Estructura de la canción" className="columns-1 gap-3 md:columns-2 [column-fill:balance]">
        {lectura.datos.bloques.map((bloque, indice) => <li key={bloque.id} className="mb-3 min-w-0 break-inside-avoid-column rounded-lg border border-borde bg-superficie px-3 py-3 sm:px-4">
          <header className="mb-2 flex items-start gap-2">
            <span aria-hidden="true" className="mt-0.5 text-[11px] tabular-nums text-butter-muted">{String(indice + 1).padStart(2, '0')}</span>
            <h3 className="min-w-0 break-words text-sm font-semibold text-butter">{nombreBloque(bloque)}</h3>
            <span aria-label={`${bloque.repeticiones} ${bloque.repeticiones === 1 ? 'repetición' : 'repeticiones'}`} className="ml-auto shrink-0 rounded border border-butter bg-fondo/30 px-1.5 py-0.5 text-xs tabular-nums text-butter">×{bloque.repeticiones}</span>
          </header>
          <div className="min-w-0">
            {(bloque.letra || bloque.anclas?.length) && <LetraConAcordes letra={bloque.letra} anclas={bloque.anclas} acordes={acordes} />}
            {bloque.nota && <p className={`${bloque.letra ? 'mt-2 ' : ''}whitespace-pre-wrap break-words text-xs leading-relaxed text-butter-muted`}>{bloque.nota}</p>}
          </div>
        </li>)}
      </ol>
      {editorAbierto && <EditorEstructuraModal key={tema.id} estructura={lectura.datos} letraTema={tema.letra ?? ''} referencia={referencia} acordes={acordes} onCerrar={() => setEditorAbierto(false)} onGuardar={guardar} guardando={guardando} error={errorGuardado} />}
    </section>
  )
}
