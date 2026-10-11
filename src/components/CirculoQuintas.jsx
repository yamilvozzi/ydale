import { sectoresCirculo, mostrarNota } from '../lib/circuloQuintas'

const punto = (radio, angulo) => {
  const radianes = (angulo - 90) * Math.PI / 180
  return [320 + radio * Math.cos(radianes), 320 + radio * Math.sin(radianes)]
}

function sector(indice, interior, exterior) {
  const desde = indice * 30 - 14.6
  const hasta = indice * 30 + 14.6
  return `M ${punto(exterior, desde)} A ${exterior} ${exterior} 0 0 1 ${punto(exterior, hasta)} L ${punto(interior, hasta)} A ${interior} ${interior} 0 0 0 ${punto(interior, desde)} Z`
}

export default function CirculoQuintas({ tonalidad, onSeleccionar }) {
  return (
    <div className="circulo-quintas">
      <svg viewBox="0 0 640 640" className="circulo-quintas-svg" role="group" aria-label="Tonalidades mayores en el anillo exterior y menores en el interior">
        {sectoresCirculo(tonalidad).map((item) => {
          const mayor = item.modo === 'mayor'
          const [x, y] = punto(mayor ? 276 : 208, item.indice * 30)
          const seleccionar = () => onSeleccionar({ tonica: item.tonica, modo: item.modo })
          return (
            <g key={`${item.indice}-${item.modo}`}
              role="button" tabIndex={0} aria-pressed={item.nivel === 'tonica'}
              aria-label={`${mostrarNota(item.tonica)} ${item.modo}${item.grado ? `, ${item.grado}` : ''}`}
              className={`circulo-sector circulo-modo-${item.modo} circulo-nivel-${item.nivel}`}
              onClick={seleccionar}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter' || evento.key === ' ') { evento.preventDefault(); seleccionar() }
              }}
            >
              <path d={sector(item.indice, mayor ? 245 : 176, mayor ? 310 : 241)} />
              <text x={x} y={y - (item.grado || item.equivalente ? 8 : 0)} className="circulo-nota">{item.nombre}</text>
              {item.equivalente && !item.grado && <text x={x} y={y + 15} className="circulo-equivalente">/ {item.equivalente}</text>}
              {item.grado && <text x={x} y={y + 17} className="circulo-grado">{item.grado}</text>}
            </g>
          )
        })}
      </svg>
      <div className="circulo-centro" aria-live="polite" aria-atomic="true">
        <h3>{mostrarNota(tonalidad.tonica)} <span>{tonalidad.modo === 'mayor' ? 'MAYOR' : 'MENOR'}</span></h3>
        <p className="circulo-relativa">Relativa: <strong>{tonalidad.relativa}</strong></p>
        <ol className="circulo-acordes" aria-label="Acordes diatónicos">
          {tonalidad.acordes.map((acorde) => <li key={acorde.grado} className={`circulo-modo-${acorde.modo} circulo-nivel-${acorde.nivel}`}>
            <span>{acorde.grado}</span><strong>{acorde.nombre}</strong>
          </li>)}
        </ol>
        <p className="circulo-armadura">{tonalidad.descripcionArmadura}{tonalidad.modo === 'menor' && <span> · Menor natural</span>}</p>
      </div>
    </div>
  )
}
