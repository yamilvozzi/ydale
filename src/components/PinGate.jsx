import { useState } from 'react'
import { usePin } from '../context/PinContext'

export default function PinGate({ children }) {
  const { desbloqueado, intentarDesbloquear } = usePin()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  if (desbloqueado) return children

  function manejarEnvio(e) {
    e.preventDefault()
    const ok = intentarDesbloquear(pin)
    if (!ok) {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-fondo px-6">
      <form onSubmit={manejarEnvio} className="w-full max-w-xs flex flex-col gap-4">
        <h1 className="text-2xl text-center mb-2 text-butter">Y daaaale!</h1>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value)
            setError(false)
          }}
          placeholder="PIN"
          className="bg-superficie border border-borde rounded-lg px-4 py-3 text-center text-lg tracking-widest text-butter placeholder-butter-muted focus:outline-none focus:border-teal"
        />
        {error && (
          <p className="text-sm text-center text-butter-muted">PIN incorrecto</p>
        )}
        <button
          type="submit"
          className="bg-teal rounded-lg py-3 text-butter hover:bg-green transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}
