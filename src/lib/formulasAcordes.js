// Intervalo cromático y grado diatónico (desde cero). Una sola definición
// alimenta el catálogo, el parser y la jerarquía de voces en cualquier tónica.
const R = [0, 0], T = [4, 2], t = [3, 2], Q = [7, 4]
const b5 = [6, 4], a5 = [8, 4], S = [9, 5]
const s7 = [10, 6], M7 = [11, 6], d7 = [9, 6]
const N = [14, 8], b9 = [13, 8], a9 = [15, 8], O = [17, 10], X = [21, 12], b13 = [20, 12]
const formula = (grados, esenciales) => ({ grados, esenciales })

export const FORMULAS_ACORDES = {
  '': formula([R, T, Q], [0, 4, 7]),
  m: formula([R, t, Q], [0, 3, 7]),
  '7': formula([R, T, Q, s7], [4, 10]),
  m7: formula([R, t, Q, s7], [3, 10]),
  maj7: formula([R, T, Q, M7], [4, 11]),
  sus2: formula([R, [2, 1], Q], [0, 2, 7]),
  sus4: formula([R, [5, 3], Q], [0, 5, 7]),
  '6': formula([R, T, Q, S], [4, 9]),
  m6: formula([R, t, Q, S], [3, 9]),
  dim: formula([R, t, b5], [0, 3, 6]),
  aug: formula([R, T, a5], [0, 4, 8]),
  mMaj7: formula([R, t, Q, M7], [3, 11]),
  dim7: formula([R, t, b5, d7], [3, 6, 9]),
  m7b5: formula([R, t, b5, s7], [3, 6, 10]),
  add9: formula([R, T, Q, N], [4, 14]),
  madd9: formula([R, t, Q, N], [3, 14]),
  add11: formula([R, T, Q, O], [4, 17]),
  '9': formula([R, T, Q, s7, N], [4, 10, 14]),
  maj9: formula([R, T, Q, M7, N], [4, 11, 14]),
  m9: formula([R, t, Q, s7, N], [3, 10, 14]),
  '7sus4': formula([R, [5, 3], Q, s7], [5, 10]),
  '7b5': formula([R, T, b5, s7], [4, 6, 10]),
  '7#5': formula([R, T, a5, s7], [4, 8, 10]),
  '7b9': formula([R, T, Q, s7, b9], [4, 10, 13]),
  '7#9': formula([R, T, Q, s7, a9], [4, 10, 15]),
  '7b13': formula([R, T, Q, s7, b13], [4, 10, 20]),
  '11': formula([R, T, Q, s7, N, O], [4, 10, 17]),
  m11: formula([R, t, Q, s7, N, O], [3, 10, 17]),
  '13': formula([R, T, Q, s7, N, O, X], [4, 10, 21]),
  m13: formula([R, t, Q, s7, N, O, X], [3, 10, 21]),
  maj13: formula([R, T, Q, M7, N, O, X], [4, 11, 21]),
}

// Conserva primero el orden de las opciones históricas del buscador.
const HISTORICOS = ['', 'm', '7', 'm7', 'maj7', 'sus2', 'sus4', '6', 'm6', 'dim', 'aug']
export const SUFIJOS_ACORDES = [...HISTORICOS, ...Object.keys(FORMULAS_ACORDES).filter(sufijo => !HISTORICOS.includes(sufijo))]
