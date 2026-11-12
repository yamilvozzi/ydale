import VolverInicio from './VolverInicio'

export default function EncabezadoSeccion({ titulo, compacto = false, acciones }) {
  return (
    <header className={`columna-encabezado ${compacto ? 'mb-2' : 'mb-4'}`}>
      <VolverInicio />
      <div className={`mt-4 border-b border-butter-muted ${compacto ? 'pb-2' : 'pb-4'} ${acciones ? 'relative flex min-h-11 items-center justify-center' : ''}`}>
        <h1 className="text-center font-sans text-xl font-normal uppercase tracking-widest text-butter">{titulo}</h1>
        {acciones && <div className="absolute right-0 flex items-center">{acciones}</div>}
      </div>
    </header>
  )
}
