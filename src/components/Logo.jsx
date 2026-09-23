export default function Logo() {
  return (
    <span className="marca-logo">
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="YDALE / Y daaaale!"
        width={1254}
        height={1254}
        fetchPriority="high"
        className="marca-logo-imagen"
      />
    </span>
  )
}
