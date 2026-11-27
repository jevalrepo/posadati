import { Camera, House, Images } from 'lucide-react'

export type Tab = 'inicio' | 'galeria'

export default function BottomNav({ tab, onTab, onCamera, count }: {
  tab: Tab; onTab: (t: Tab) => void; onCamera: () => void; count: number
}) {
  const item = (t: Tab, label: string, icon: React.ReactNode, badge?: number) => (
    <button
      type="button"
      onClick={() => onTab(t)}
      aria-current={tab === t ? 'page' : undefined}
      className={`relative flex min-h-14 flex-1 cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
        tab === t ? 'text-banorte' : 'text-carbon-soft'
      }`}
    >
      <span className="relative">
        {icon}
        {!!badge && (
          <span className="absolute -right-3 -top-1.5 min-w-5 rounded-full bg-banorte px-1.5 text-[10px] leading-5 text-white">{badge > 99 ? '99+' : badge}</span>
        )}
      </span>
      {label}
    </button>
  )

  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
    >
      <div className="relative flex items-center rounded-[26px] bg-white/95 px-2 shadow-[0_8px_30px_rgba(27,35,42,.14)] ring-1 ring-black/5 backdrop-blur">
        {item('inicio', 'Inicio', <House size={22} strokeWidth={tab === 'inicio' ? 2.4 : 2} />)}
        <div className="w-20 shrink-0" aria-hidden />
        {item('galeria', 'Galería', <Images size={22} strokeWidth={tab === 'galeria' ? 2.4 : 2} />, count)}
        <button
          type="button"
          onClick={onCamera}
          aria-label="Tomar foto"
          className="absolute left-1/2 top-0 grid h-16 w-16 -translate-x-1/2 -translate-y-1/3 cursor-pointer place-items-center rounded-full bg-banorte text-white shadow-lg shadow-banorte/40 ring-[5px] ring-canvas transition active:scale-95 active:bg-banorte-dark"
        >
          <Camera size={26} strokeWidth={2.2} />
        </button>
      </div>
    </nav>
  )
}
