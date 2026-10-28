import VolverInicio from './VolverInicio'

export default function EncabezadoSeccion({ titulo, compacto = false }) {
  return (
    <header className={`columna-encabezado ${compacto ? 'mb-2' : 'mb-4'}`}>
      <VolverInicio />
      <h1 className={`mt-4 border-b border-borde ${compacto ? 'pb-2' : 'pb-4'} text-center font-sans text-xl font-normal uppercase tracking-widest text-butter`}>
        {titulo}
      </h1>
    </header>
  )
}
