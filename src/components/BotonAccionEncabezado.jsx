import { FileDown } from 'lucide-react'

export default function BotonAccionEncabezado({ icono: Icono, etiqueta, onClick, disabled }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={etiqueta} title={etiqueta}
    className="accion-plana accion-icono rounded-lg disabled:opacity-40">
    <Icono aria-hidden="true" />
  </button>
}

export function BotonExportarPDF({ onClick, disabled }) {
  return <BotonAccionEncabezado icono={FileDown} etiqueta="Exportar PDF" onClick={onClick} disabled={disabled} />
}
