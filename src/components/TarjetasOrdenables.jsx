import { useRef, useState } from 'react'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import AcordeDiagrama from './AcordeDiagrama'
import EscalaDiagrama from './EscalaDiagrama'
import { etiquetaTipo } from '../lib/escalas'

const nombreTarjeta = (tipo, datos) => tipo === 'escala'
  ? `${datos.tonica} · ${etiquetaTipo(datos.tipo)}` : datos.nombre || 'Sin nombre'

function Tarjeta({ tipo, datos, disabled, onEditar, onEliminar }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: datos.id, disabled })
  const nombre = nombreTarjeta(tipo, datos)
  const mover = <button
    type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
    disabled={disabled} aria-label={`Mover ${nombre}`} title={`Mover ${nombre}`}
    className="tarjeta-control tarjeta-mover"
  ><GripVertical aria-hidden="true" /></button>
  const editar = <button type="button" disabled={disabled} onClick={() => onEditar(datos)} aria-label={`Editar ${nombre}`} title="Editar" className="tarjeta-control"><Pencil aria-hidden="true" /></button>
  const eliminar = <button type="button" disabled={disabled} onClick={() => onEliminar(datos)} aria-label={`Eliminar ${nombre}`} title="Eliminar" className="tarjeta-control tarjeta-eliminar"><Trash2 aria-hidden="true" /></button>

  return <article
    ref={setNodeRef}
    // Sólo traslación: nunca escalar el diapasón al pasar sobre una tarjeta de otro ancho.
    style={{ transform: CSS.Translate.toString(transform), transition }}
    className={`tarjeta-musical tarjeta-${tipo}${isDragging ? ' tarjeta-arrastrando' : ''}`}
  >
    <header className="tarjeta-cabecera">
      {tipo === 'escala' && <div className="tarjeta-mover-sector">{mover}</div>}
      <h3 className="tarjeta-nombre" title={nombre}>{nombre}</h3>
      {tipo === 'escala' && <div className="tarjeta-editar-sector">{editar}{eliminar}</div>}
    </header>
    <div className="min-w-0 overflow-x-auto">
      {tipo === 'escala' ? <EscalaDiagrama escala={datos} /> : <AcordeDiagrama acorde={datos} />}
    </div>
    {tipo === 'acorde' && <footer className="tarjeta-controles">{mover}{editar}{eliminar}</footer>}
  </article>
}

/** Una misma interacción para la grilla de acordes y la lista de escalas. */
export default function TarjetasOrdenables({ tipo, items, onReordenar, onEditar, onEliminar, disabled = false }) {
  const [pendientes, setPendientes] = useState(null)
  const [error, setError] = useState('')
  const guardando = useRef(false)
  const visibles = pendientes ?? items
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function alSoltar({ active, over }) {
    if (!over || active.id === over.id || disabled || guardando.current) return
    const desde = items.findIndex(({ id }) => id === active.id)
    const hasta = items.findIndex(({ id }) => id === over.id)
    if (desde < 0 || hasta < 0) return
    const nuevos = arrayMove(items, desde, hasta)
    guardando.current = true
    setPendientes(nuevos)
    setError('')
    try {
      if (await onReordenar(nuevos) === false) throw new Error('Guardado rechazado')
    } catch {
      setError('No se pudo guardar el orden. Revisá la conexión o el almacenamiento e intentá de nuevo.')
    } finally {
      guardando.current = false
      setPendientes(null)
    }
  }

  const posicion = (id) => visibles.findIndex((item) => item.id === id) + 1
  const nombre = (id) => nombreTarjeta(tipo, visibles.find((item) => item.id === id) ?? {})
  return <div className="min-w-0">
    {error && <p role="alert" className="mb-3 text-sm text-butter-muted">{error}</p>}
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={alSoltar}
      accessibility={{
        screenReaderInstructions: { draggable: 'Para mover, presioná espacio. Usá las flechas para elegir la posición, espacio para soltar y Escape para cancelar.' },
        announcements: {
          onDragStart: ({ active }) => `Moviendo ${nombre(active.id)}, posición ${posicion(active.id)} de ${visibles.length}.`,
          onDragOver: ({ over }) => over ? `Posición ${posicion(over.id)} de ${visibles.length}.` : 'Fuera de la lista.',
          onDragEnd: ({ over }) => over ? `Soltado en la posición ${posicion(over.id)}.` : 'Movimiento cancelado.',
          onDragCancel: () => 'Movimiento cancelado. Se conserva el orden anterior.',
        },
      }}
    >
      <SortableContext items={visibles} strategy={tipo === 'escala' ? verticalListSortingStrategy : rectSortingStrategy}>
        <div aria-label={tipo === 'escala' ? 'Escalas' : 'Acordes'} aria-busy={Boolean(pendientes)} className={tipo === 'escala' ? 'flex min-w-0 flex-col gap-4' : 'flex min-w-0 flex-wrap items-start gap-3'}>
          {visibles.map((datos) => <Tarjeta key={datos.id} tipo={tipo} datos={datos} disabled={disabled || Boolean(pendientes)} onEditar={onEditar} onEliminar={onEliminar} />)}
        </div>
      </SortableContext>
    </DndContext>
  </div>
}
