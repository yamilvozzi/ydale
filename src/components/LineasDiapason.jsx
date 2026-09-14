/** Las líneas decorativas no alteran el área de las celdas ni su centro. */
export default function LineasDiapason({ traste = false, cejuela = false }) {
  return (
    <>
      <span aria-hidden="true" className="diagrama-cuerda" />
      {traste && <span aria-hidden="true" className="diagrama-traste" />}
      {cejuela && <span aria-hidden="true" className="diagrama-cejuela" />}
    </>
  )
}
