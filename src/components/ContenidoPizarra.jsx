import { useState } from 'react'
import {
  closestCenter, DndContext, DragOverlay, KeyboardSensor, MouseSensor, pointerWithin, TouchSensor,
  useDroppable, useSensor, useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import BloqueMusical from './BloqueMusical'
import TarjetasOrdenables, { ListaTarjetasOrdenables } from './TarjetasOrdenables'
import { colocarAcordeEnBloque, columnaBloque, COLUMNAS_BLOQUES, moverBloque } from '../lib/bloquesPizarra'

function admiteDestino(origen, destino, teclado) {
  if (origen.tipo === 'bloque') return destino.tipo === 'bloque' || (destino.tipo === 'columna' && (!teclado || destino.vacia))
  if (destino.tipo === 'cifrado' || destino.tipo === 'compas') {
    return (!teclado || origen.tipo === 'cifrado') && (destino.tipo === 'cifrado' || !teclado || destino.vacio)
  }
  return origen.tipo === 'acorde' && destino.tipo === 'acorde'
}

function coordenadasTeclado(evento, args) {
  const { context } = args
  const contenedores = context.droppableContainers
  return sortableKeyboardCoordinates(evento, {
    ...args,
    context: {
      ...context,
      droppableContainers: {
        get: id => contenedores.get(id),
        getEnabled: () => contenedores.getEnabled().filter(({ data }) => admiteDestino(context.active.data.current, data.current, true)),
      },
    },
  })
}

function detectarDestino(args) {
  const { active, collisionRect, droppableRects, pointerCoordinates } = args
  const origen = active.data.current
  const contenedores = args.droppableContainers.filter(({ data }) => admiteDestino(origen, data.current, !pointerCoordinates))
  const parametros = { ...args, droppableContainers: contenedores }
  let coincidencias
  if (pointerCoordinates) {
    coincidencias = pointerWithin(parametros)
  } else if (origen.tipo === 'acorde') {
    coincidencias = closestCenter(parametros)
  } else {
    // El sensor de teclado alinea la esquina de origen con la del destino.
    coincidencias = contenedores.map(contenedor => {
      const rect = droppableRects.get(contenedor.id)
      const distancia = rect ? Math.hypot(rect.left - collisionRect.left, rect.top - collisionRect.top) : Infinity
      return { id: contenedor.id, data: { droppableContainer: contenedor, value: distancia } }
    }).sort((a, b) => a.data.value - b.data.value).slice(0, 1)
  }

  const prioridad = { cifrado: 0, compas: 1, bloque: 0, columna: 1, acorde: 0 }
  const destino = coincidencias.sort((a, b) =>
    prioridad[a.data.droppableContainer.data.current.tipo] - prioridad[b.data.droppableContainer.data.current.tipo],
  )[0]
  if (!destino) return []
  const { tipo } = destino.data.droppableContainer.data.current
  const rect = droppableRects.get(destino.id)
  const inicial = active.rect.current.initial
  if (rect && tipo === 'bloque') {
    destino.data.despues = pointerCoordinates ? pointerCoordinates.y >= rect.top + rect.height / 2 : inicial?.top < rect.top
  }
  if (rect && tipo === 'cifrado') {
    destino.data.despues = pointerCoordinates ? pointerCoordinates.x >= rect.left + rect.width / 2 :
      inicial?.top < rect.top || (inicial?.top === rect.top && inicial.left < rect.left)
  }
  return [destino]
}

function ColumnaBloques({ columna, bloques, onMover, onGuardar, onEliminar, acordes, error }) {
  const { setNodeRef, isOver, active } = useDroppable({ id: `columna:${columna}`, data: { tipo: 'columna', columna, vacia: !bloques.length } })
  const otra = columna === 'izquierda' ? 'derecha' : 'izquierda'
  return <div ref={setNodeRef} role="group" aria-label={`Columna ${columna}`} className="pizarra-columna"
    data-vacia={!bloques.length || undefined} data-arrastrando={active?.data.current.tipo === 'bloque' || undefined} data-destino={isOver || undefined}>
    {bloques.map((bloque, indice) => <BloqueMusical key={bloque.id} bloque={bloque} acordes={acordes} error={error}
      onGuardar={onGuardar} onEliminar={() => onEliminar(bloque.id)}
      subir={indice > 0 ? () => onMover(bloque.id, { columna, referencia: bloques[indice - 1].id }) : undefined}
      bajar={indice < bloques.length - 1 ? () => onMover(bloque.id, { columna, referencia: bloques[indice + 1].id, despues: true }) : undefined}
      cambiarColumna={() => onMover(bloque.id, { columna: otra })}
      otraColumna={otra} />)}
  </div>
}

export default function ContenidoPizarra({ pizarra, bloques, acordes, escalas, onEditar, onEliminar }) {
  const { actualizarElementos, reordenar, guardar, eliminar, lecturaFallida, error } = pizarra
  const [arrastre, setArrastre] = useState(null)
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordenadasTeclado,
      keyboardCodes: { start: ['Space'], end: ['Space'], cancel: ['Escape'] },
    }),
  )
  const mover = (id, destino) => actualizarElementos(elementos => moverBloque(elementos, id, destino))

  function alSoltar({ active, over, collisions }) {
    setArrastre(null)
    if (!over || active.id === over.id) return
    const origen = active.data.current
    const destino = over.data.current
    const despues = collisions?.[0]?.data?.despues
    if (origen.tipo === 'bloque') {
      mover(origen.bloqueId, { columna: destino.columna, referencia: destino.bloqueId, despues })
    } else if (destino.tipo === 'acorde') {
      const desde = acordes.findIndex(acorde => acorde.id === active.id)
      const hasta = acordes.findIndex(acorde => acorde.id === over.id)
      if (desde >= 0 && hasta >= 0) reordenar('acorde', arrayMove(acordes, desde, hasta))
    } else {
      actualizarElementos(elementos => colocarAcordeEnBloque(elementos, { ...origen, id: active.id }, {
        ...destino, referencia: destino.entradaId, despues,
      }))
    }
  }

  return <>
    <DndContext sensors={sensores} collisionDetection={detectarDestino} onDragEnd={alSoltar}
      onDragStart={({ active }) => setArrastre(active.data.current)} onDragCancel={() => setArrastre(null)}
      accessibility={{
        screenReaderInstructions: { draggable: 'Presioná espacio para arrastrar. Usá las flechas para elegir el destino, espacio para soltar o Escape para cancelar.' },
        announcements: {
          onDragStart: ({ active }) => `Moviendo ${active.data.current.nombre}.`,
          onDragOver: ({ over }) => over ? `Destino: ${over.data.current.nombre ?? over.data.current.columna}.` : 'Fuera de un destino válido.',
          onDragEnd: ({ over }) => over ? 'Arrastre terminado.' : 'Movimiento cancelado.',
          onDragCancel: () => 'Movimiento cancelado.',
        },
      }}>
      {bloques.length > 0 && <div role="group" aria-label="Bloques musicales" className="pizarra-bloques">
        {COLUMNAS_BLOQUES.map(columna => <ColumnaBloques key={columna} columna={columna} acordes={acordes} error={error}
          bloques={bloques.filter(bloque => columnaBloque(bloque) === columna)}
          onMover={mover} onGuardar={datos => guardar('bloque', datos)} onEliminar={eliminar} />)}
      </div>}
      {acordes.length > 0 && <ListaTarjetasOrdenables tipo="acorde" items={acordes} disabled={lecturaFallida}
        onEditar={datos => onEditar('acorde', datos)} onEliminar={datos => onEliminar('acorde', datos)}
        arrastreDesdeDiagrama={bloques.length > 0} />}
      <DragOverlay dropAnimation={null} className="pointer-events-none">
        {arrastre && <div className="pizarra-arrastre" aria-hidden="true">{arrastre.nombre}</div>}
      </DragOverlay>
    </DndContext>
    {escalas.length > 0 && <TarjetasOrdenables tipo="escala" items={escalas} disabled={lecturaFallida}
      onReordenar={ordenados => reordenar('escala', ordenados)} onEditar={datos => onEditar('escala', datos)}
      onEliminar={datos => onEliminar('escala', datos)} onResaltado={datos => guardar('escala', datos)} />}
  </>
}
