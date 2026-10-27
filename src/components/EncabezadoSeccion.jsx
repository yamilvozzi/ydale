import VolverInicio from './VolverInicio'

export default function EncabezadoSeccion({ titulo }) {
  return (
    <header className="mx-auto mb-4 w-full max-w-6xl">
      <VolverInicio />
      <h1 className="mt-4 border-b border-borde pb-4 text-center font-sans text-xl font-normal uppercase tracking-widest text-butter">
        {titulo}
      </h1>
    </header>
  )
}
