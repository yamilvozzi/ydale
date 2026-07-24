import { createContext, useContext, useState } from 'react'

const CLAVE_STORAGE = 'ydaaaale_desbloqueado'
const PinContext = createContext(null)

export function PinProvider({ children }) {
  const [desbloqueado, setDesbloqueado] = useState(
    () => localStorage.getItem(CLAVE_STORAGE) === 'true'
  )

  function intentarDesbloquear(pin) {
    const correcto = pin === import.meta.env.VITE_APP_PIN
    if (correcto) {
      localStorage.setItem(CLAVE_STORAGE, 'true')
      setDesbloqueado(true)
    }
    return correcto
  }

  return (
    <PinContext.Provider value={{ desbloqueado, intentarDesbloquear }}>
      {children}
    </PinContext.Provider>
  )
}

export function usePin() {
  const contexto = useContext(PinContext)
  if (!contexto) throw new Error('usePin debe usarse dentro de <PinProvider>')
  return contexto
}
