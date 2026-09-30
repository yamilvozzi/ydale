import { useState } from 'react'
import { PinContext } from './pin'

const CLAVE_STORAGE = 'ydaaaale_desbloqueado'

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
