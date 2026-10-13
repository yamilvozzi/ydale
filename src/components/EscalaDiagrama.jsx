import Diapason from './Diapason'
import { X } from 'lucide-react'
import { useState } from 'react'
import SelectorAcordeEscala from './SelectorAcordeEscala'
import { obtenerMarcadoresEscalaConAcorde } from '../lib/resaltadoEscala'
import { claseDeNota } from '../lib/circuloQuintas'
import { transponerNombreAcorde } from '../lib/transposicion'

export default function EscalaDiagrama({ escala }) {
  const [acordes, setAcordes] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)
  // Cada chip recuerda la tónica al incorporarse. Acompaña la transposición
  // global sin escribir acordes independientes ni alterar la escala guardada.
  const visibles = acordes.map(acorde => {
    const distancia = claseDeNota(escala.tonica) - claseDeNota(acorde.tonica)
    return { ...acorde, nombre: distancia ? transponerNombreAcorde(acorde.nombre, distancia) : acorde.nombre }
  })
  const nombreSeleccionado = visibles.find(acorde => acorde.id === seleccionado)?.nombre
  const notas = obtenerMarcadoresEscalaConAcorde(escala.tonica, escala.tipo, nombreSeleccionado)

  function agregar(nombre) {
    if (visibles.some(acorde => acorde.nombre === nombre)) return
    setAcordes(actuales => [...actuales, { id: globalThis.crypto.randomUUID(), nombre, tonica: escala.tonica }])
  }

  return (
    <div className="escala-diagrama">
      <div className="escala-grafico rounded-lg focus-visible:outline-2 focus-visible:outline-butter"
        role="button" tabIndex={0} aria-label="Mostrar todas las notas de la escala" aria-pressed={!nombreSeleccionado}
        onClick={() => setSeleccionado(null)}
        onKeyDown={evento => {
          if (['Enter', ' ', 'Escape'].includes(evento.key)) { evento.preventDefault(); setSeleccionado(null) }
        }}
      >
        <Diapason
          etiqueta={`Diapasón de la escala ${escala.tonica} ${escala.tipo}`}
          obtenerMarcador={(_cuerda, _traste, nota) => notas.get(nota) ?? null}
        />
      </div>
      <div role="group" aria-label="Acordes de la escala" className="mt-2 flex items-center gap-2 border-t border-borde pt-3">
        <SelectorAcordeEscala onAgregar={agregar} />
        {visibles.length > 0 && <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto p-0.5 [scrollbar-width:thin]">
          {visibles.map(acorde => <span key={acorde.id} className={`inline-flex shrink-0 items-center rounded-lg border ${seleccionado === acorde.id ? 'border-butter bg-teal text-butter' : 'border-borde bg-fondo text-butter-muted'}`}>
            <button type="button" aria-pressed={seleccionado === acorde.id} onClick={() => setSeleccionado(acorde.id)} className="min-h-11 rounded-l-lg px-3 text-sm hover:text-butter focus-visible:outline-2 focus-visible:outline-butter">{acorde.nombre}</button>
            <button type="button" aria-label={`Quitar ${acorde.nombre} de la escala`} onClick={() => {
              setAcordes(actuales => actuales.filter(actual => actual.id !== acorde.id))
              if (seleccionado === acorde.id) setSeleccionado(null)
            }} className="flex min-h-11 min-w-8 items-center justify-center rounded-r-lg hover:text-butter focus-visible:outline-2 focus-visible:outline-butter"><X size={12} /></button>
          </span>)}
        </div>}
      </div>
    </div>
  )
}
