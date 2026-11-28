export const LOGO_URL = `${import.meta.env.BASE_URL}banorte-logo.png`

export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src={LOGO_URL} alt="Banorte" className="h-10 w-10 rounded-full shadow-md shadow-banorte/25" />
      <div className="leading-none">
        <p className="text-[15px] font-extrabold tracking-tight text-ink">Posada TI</p>
        <p className="mt-0.5 text-[11px] font-semibold tracking-[.18em] text-banorte">2026</p>
      </div>
    </div>
  )
}
