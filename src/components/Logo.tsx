export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-banorte shadow-md shadow-banorte/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
          <path d="M12 2.5l2.35 6.4 6.65.35-5.2 4.15 1.8 6.6L12 16.2 6.4 20l1.8-6.6L3 9.25l6.65-.35z" fill="#fff" />
        </svg>
      </span>
      <div className="leading-none">
        <p className="text-[15px] font-extrabold tracking-tight text-ink">Posada TI</p>
        <p className="mt-0.5 text-[11px] font-semibold tracking-[.18em] text-banorte">2026</p>
      </div>
    </div>
  )
}
