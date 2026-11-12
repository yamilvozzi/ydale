import { useEffect, useState } from 'react'
import DialogoPizarra, { botonPizarra, botonPrincipalPizarra } from './DialogoPizarra'
import { setlistsDB } from '../hooks/useSetlists'
import { supabase } from '../lib/supabaseClient'
import { prepararMusicaTema } from '../lib/musicaRepertorio'
import { abrirImpresionPDF, contenidoTemaPDF, imprimirPizarra, imprimirSetlist, imprimirTema, seccionesDisponiblesPDF, SECCIONES_PDF } from '../lib/impresionPDF'

export default function ModalExportarPDF({ tipo, datos, onCerrar }) {
  const necesitaCarga = tipo === 'tema' || (tipo === 'setlist' && !datos.items)
  const [carga, setCarga] = useState({ cargando: necesitaCarga, escalas: [], setlist: null, error: '' })
  const [intento, setIntento] = useState(0)
  const [seleccion, setSeleccion] = useState(null)
  const [orientacion, setOrientacion] = useState(tipo === 'pizarra' ? 'apaisado' : 'vertical')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!necesitaCarga) return
    let vigente = true
    async function cargar() {
      try {
        if (tipo === 'setlist') {
          const setlist = await setlistsDB.leer(datos.id)
          if (!setlist) throw new Error('Setlist no encontrado')
          if (vigente) setCarga({ cargando: false, escalas: [], setlist, error: '' })
          return
        }
        const { data, error } = await supabase.from('escalas').select('id,tonica,tipo,orden').eq('tema_id', datos.id)
          .order('orden', { ascending: true }).order('created_at', { ascending: true })
        if (error || !Array.isArray(data)) throw new Error('Escalas no disponibles')
        const escalas = prepararMusicaTema(datos, data).escalas
        if (vigente) setCarga({ cargando: false, escalas, setlist: null, error: '' })
      } catch {
        if (vigente) setCarga({ cargando: false, escalas: [], setlist: null,
          error: tipo === 'tema' ? 'No se pudo preparar la escala. Las demás secciones siguen disponibles.' : 'No se pudo cargar el listado completo de canciones.' })
      }
    }
    cargar()
    return () => { vigente = false }
  }, [datos, intento, necesitaCarga, tipo])

  const contenido = tipo === 'tema' ? contenidoTemaPDF(datos, carga.escalas) : null
  const disponibles = contenido ? seccionesDisponiblesPDF(contenido) : null
  const inicial = disponibles && SECCIONES_PDF.find(([clave]) => disponibles[clave])?.[0]
  const marcadas = seleccion ?? (inicial ? [inicial] : [])
  const setlist = tipo === 'setlist' ? (carga.setlist ?? (datos.items ? datos : null)) : null
  const listo = tipo === 'tema' ? marcadas.some(clave => disponibles[clave]) : tipo === 'setlist' ? Boolean(setlist) : datos.pizarra.elementos.length > 0

  function abrir(e) {
    e.preventDefault()
    setError('')
    try {
      const html = tipo === 'tema' ? imprimirTema(contenido, marcadas, orientacion)
        : tipo === 'setlist' ? imprimirSetlist(setlist) : imprimirPizarra(datos.pizarra, datos.proyecto, orientacion)
      abrirImpresionPDF(html)
      onCerrar()
    } catch (error) {
      setError(error.message || 'No se pudo abrir la vista de impresión.')
    }
  }

  return <DialogoPizarra titulo="Exportar PDF" onCerrar={onCerrar}>
    <form onSubmit={abrir} className="space-y-4">
      {contenido && <fieldset className="min-w-0 space-y-1">
        <legend className="mb-2 text-sm font-semibold">Contenido</legend>
        {SECCIONES_PDF.map(([clave, nombre]) => <label key={clave} className="flex min-h-9 items-center gap-2 text-sm has-disabled:text-butter-muted">
          <input type="checkbox" checked={disponibles[clave] && marcadas.includes(clave)} disabled={!disponibles[clave]}
            onChange={e => setSeleccion(e.target.checked ? [...marcadas, clave] : marcadas.filter(opcion => opcion !== clave))} className="size-4 shrink-0 accent-teal" />
          <span>{nombre}{!disponibles[clave] && <small className="ml-2">{' '}{clave === 'escala' && carga.cargando ? 'Cargando…' : clave === 'estructura' && contenido.estructuraIncompatible ? 'Formato incompatible' : clave === 'escala' && carga.error ? 'No disponible' : 'Sin contenido'}</small>}</span>
        </label>)}
      </fieldset>}
      {tipo !== 'setlist' && <fieldset className="flex flex-wrap gap-x-4 gap-y-1">
        <legend className="mb-2 text-sm font-semibold">Orientación</legend>
        {['vertical', 'apaisado'].map(valor => <label key={valor} className="flex min-h-9 items-center gap-2 text-sm">
          <input type="radio" name="orientacion-pdf" value={valor} checked={orientacion === valor} onChange={() => setOrientacion(valor)} className="size-4 accent-teal" />
          A4 {valor}
        </label>)}
      </fieldset>}
      {tipo === 'setlist' && carga.cargando && <p role="status" className="text-sm text-butter-muted">Cargando canciones…</p>}
      {carga.error && <div role="alert" className="space-y-2 text-sm text-butter-muted"><p>{carga.error}</p>
        <button type="button" className={botonPizarra} onClick={() => { setCarga(actual => ({ ...actual, cargando: true, error: '' })); setIntento(actual => actual + 1) }}>Reintentar</button>
      </div>}
      {error && <p role="alert" className="text-sm text-butter-muted">{error}</p>}
      <p className="text-sm text-butter-muted">En la vista de impresión podés imprimir o guardar como PDF.</p>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCerrar} className={botonPizarra}>Cancelar</button>
        <button type="submit" disabled={!listo} className={botonPrincipalPizarra}>Abrir vista de impresión</button>
      </div>
    </form>
  </DialogoPizarra>
}
