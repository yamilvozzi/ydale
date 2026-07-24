import { Routes, Route, Navigate } from 'react-router-dom'
import Repertorio from './pages/Repertorio'
import Tema from './pages/Tema'
import Letra from './components/tabs/Letra'
import Estructura from './components/tabs/Estructura'
import Escala from './components/tabs/Escala'
import Percusion from './components/tabs/Percusion'
import Notas from './components/tabs/Notas'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Repertorio />} />
      <Route path="/tema/:id" element={<Tema />}>
        {/* Sin sección explícita, entra directo a LETRA */}
        <Route index element={<Navigate to="letra" replace />} />
        <Route path="letra" element={<Letra />} />
        <Route path="estructura" element={<Estructura />} />
        <Route path="escala" element={<Escala />} />
        <Route path="percusion" element={<Percusion />} />
        <Route path="notas" element={<Notas />} />
      </Route>
    </Routes>
  )
}
