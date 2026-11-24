import { GripVertical, Plus } from 'lucide-react'
import { useDndContext, useDraggable, useDroppable } from '@dnd-kit/core'
import { useCombinedRefs } from '@dnd-kit/utilities'
import MenuSetlist from './MenuSetlist'
import { nombreAcordeBloque } from '../lib/bloquesPizarra'

export function CabeceraBloque({ bloque, cantidad, nombre, arrastre, acciones, disabled }) {
  const { setActivatorNodeRef, attributes, listeners } = arrastre
  return <header className="bloque-cabecera">
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} disabled={disabled}
      aria-label={`Mover ${nombre}`} title={`Mover ${nombre}`} className="tarjeta-control tarjeta-mover"><GripVertical aria-hidden="true" /></button>
    <div className="min-w-0 flex-1">
      {bloque.titulo && <h3 className="bloque-titulo" title={bloque.titulo}>{bloque.titulo}</h3>}
    </div>
    <span className="bloque-cantidad">{bloque.tipo === 'libre' ? 'Libre' : `${cantidad} ${cantidad === 1 ? 'compás' : 'compases'}`}</span>
    <span className="bloque-repeticiones" title={`${bloque.repeticiones} repeticiones`}>×{bloque.repeticiones}</span>
    <MenuSetlist nombre={nombre} acciones={acciones} disabled={disabled} flotante horizontal />
  </header>
}

function CifradoBloque({ bloqueId, compas, entrada, onConsultar, disabled }) {
  const { collisions } = useDndContext()
  const id = `cifrado:${bloqueId}:${compas}:${entrada.id}`
  const nombre = nombreAcordeBloque(entrada)
  const data = { tipo: 'cifrado', nombre, bloqueId, compas, entradaId: entrada.id }
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id, data, disabled })
  const destino = useDroppable({ id, data, disabled })
  const ref = useCombinedRefs(setNodeRef, destino.setNodeRef)
  const insercion = destino.isOver && !isDragging ? (collisions?.[0]?.data?.despues ? 'despues' : 'antes') : undefined
  return <li className="min-w-0 max-w-full">
    <button type="button" ref={ref} {...attributes} {...listeners} aria-haspopup="dialog" disabled={disabled}
      onClick={() => { if (!isDragging) onConsultar(entrada.id) }} onContextMenu={evento => evento.preventDefault()}
      data-insercion={insercion} data-arrastrando={isDragging || undefined} className="bloque-cifrado">{nombre}</button>
  </li>
}

export function CompasBloque({ bloqueId, compas, numero, acordes, onAgregar, onConsultar, disabled }) {
  const nombre = numero ? `Compás ${numero}` : 'Secuencia libre'
  const { setNodeRef, isOver } = useDroppable({
    id: `compas:${bloqueId}:${compas}`, data: { tipo: 'compas', nombre, bloqueId, compas, vacio: !acordes.length }, disabled,
  })

  return <div ref={setNodeRef} role="group" aria-label={nombre} data-destino={isOver || undefined} className="bloque-compas">
    {numero && <div aria-hidden="true" className="bloque-numero">{numero}</div>}
    {onAgregar && <button type="button" aria-haspopup="dialog" aria-label={numero ? `Agregar acorde al compás ${numero}` : 'Agregar acorde al bloque libre'}
      title="Agregar acorde" onClick={onAgregar} className="tarjeta-control bloque-agregar-acorde"><Plus aria-hidden="true" /></button>}
    {acordes.length > 0 && <ul className="bloque-cifrados">
      {acordes.map(entrada => <CifradoBloque key={entrada.id} bloqueId={bloqueId} compas={compas} entrada={entrada} onConsultar={onConsultar} disabled={disabled} />)}
    </ul>}
  </div>
}
