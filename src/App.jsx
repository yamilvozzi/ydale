import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Repertorio from './pages/Repertorio'
import Inicio from './pages/Inicio'
import Pizarra from './pages/Pizarra'
import Tema from './pages/Tema'
import Setlists from './pages/Setlists'
import Setlist from './pages/Setlist'
import Letra from './components/tabs/Letra'
import Estructura from './components/tabs/Estructura'
import Escala from './components/tabs/Escala'
import Percusion from './components/tabs/Percusion'
import Notas from './components/tabs/Notas'

function PrimeraSeccionTema() {
  const location = useLocation()
  return <Navigate to={{ pathname: 'letra', search: location.search }} state={location.state} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/repertorio" element={<Repertorio />} />
      <Route path="/pizarra" element={<Pizarra />} />
      <Route path="/setlists" element={<Setlists />} />
      <Route path="/setlists/:id" element={<Setlist />} />
      <Route path="/tema/:id" element={<Tema />}>
        {/* Sin sección explícita, entra directo a LETRA */}
        <Route index element={<PrimeraSeccionTema />} />
        <Route path="letra" element={<Letra />} />
        <Route path="estructura" element={<Estructura />} />
        <Route path="escala" element={<Escala />} />
        <Route path="percusion" element={<Percusion />} />
        <Route path="notas" element={<Notas />} />
      </Route>
    </Routes>
  )
}
