/** El círculo y su texto comparten centro y escala en todos los diapasones. */
export default function MarcadorNota({ nota, esTonica = false, esNotaBlues = false }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`diagrama-marcador diagrama-nota ${
        esTonica ? 'diagrama-nota-tonica' : esNotaBlues ? 'diagrama-nota-blues' : ''
      }`}
    >
      <circle cx="12" cy="12" r="11.5" />
      {nota && (
        <text x="12" y="12" textAnchor="middle" dominantBaseline="central">
          {nota}
        </text>
      )}
    </svg>
  )
}
