import { useContext } from 'react'
import { PinContext } from '../context/pin'

export function usePin() {
  const contexto = useContext(PinContext)
  if (!contexto) throw new Error('usePin debe usarse dentro de <PinProvider>')
  return contexto
}
