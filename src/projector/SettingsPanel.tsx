import { RotateCcw, X } from 'lucide-react'
import { COLOR_FX, FITS, ORDERS, TRANSITIONS, type Settings } from './settings'

interface Props {
  settings: Settings
  update: <K extends keyof Settings>(k: K, v: Settings[K]) => void
  reset: () => void
  onClose: () => void
}

export default function SettingsPanel({ settings: s, update, reset, onClose }: Props) {
  return (
    <aside
      aria-label="Ajustes de la presentación"
      className="absolute inset-y-0 right-0 z-30 flex w-[380px] max-w-full flex-col border-l border-white/10 bg-[#11171c]/85 text-white shadow-2xl backdrop-blur-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 pb-4 pt-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.2em] text-white/45">Proyector</p>
          <h2 className="text-xl font-extrabold">Ajustes</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar ajustes" className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/10 hover:bg-white/20">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-6 pb-6">
        <Group title="Transición">
          <Chips options={TRANSITIONS} value={s.transition} onChange={(v) => update('transition', v)} cols={2} />
        </Group>

        <Group title={`Tiempo por foto · ${s.interval} s`}>
          <input type="range" min={3} max={30} step={1} value={s.interval} onChange={(e) => update('interval', +e.target.value)} className="projector-range w-full cursor-pointer" aria-label="Tiempo por foto" />
          <Scale left="3 s" right="30 s" />
        </Group>

        <Group title={`Velocidad de transición · ${(s.speed / 1000).toFixed(1)} s`}>
          <input type="range" min={300} max={3000} step={100} value={s.speed} onChange={(e) => update('speed', +e.target.value)} className="projector-range w-full cursor-pointer" aria-label="Velocidad de transición" />
          <Scale left="Rápida" right="Lenta" />
        </Group>

        <Group title="Movimiento">
          <Toggle label="Efecto Ken Burns" hint="Acercamiento lento mientras se muestra la foto" checked={s.kenBurns} onChange={(v) => update('kenBurns', v)} />
        </Group>

        <Group title="Orden">
          <Chips options={ORDERS} value={s.order} onChange={(v) => update('order', v)} cols={3} />
        </Group>

        <Group title="Encuadre">
          <Chips options={FITS} value={s.fit} onChange={(v) => update('fit', v)} cols={2} />
        </Group>

        <Group title="Efecto de color">
          <Chips options={COLOR_FX} value={s.colorFx} onChange={(v) => update('colorFx', v)} cols={2} />
        </Group>

        <Group title="En pantalla">
          <div className="space-y-2">
            <Toggle label="Código QR para subir fotos" checked={s.showQr} onChange={(v) => update('showQr', v)} />
            <Toggle label="Logo y contador" checked={s.showInfo} onChange={(v) => update('showInfo', v)} />
            <Toggle label="Mostrar fotos nuevas al instante" hint="Las fotos recién subidas pasan primero" checked={s.prioritizeNew} onChange={(v) => update('prioritizeNew', v)} />
          </div>
        </Group>

        <div className="rounded-2xl bg-white/5 p-4 text-xs leading-6 text-white/60">
          <p className="mb-1 font-bold text-white/80">Atajos de teclado</p>
          <Kbd k="Espacio" t="Pausar / reanudar" />
          <Kbd k="← →" t="Foto anterior / siguiente" />
          <Kbd k="F" t="Pantalla completa" />
          <Kbd k="S" t="Abrir / cerrar ajustes" />
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <button type="button" onClick={reset} className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold hover:bg-white/15">
          <RotateCcw size={16} /> Restablecer ajustes
        </button>
      </div>
    </aside>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-[13px] font-bold text-white/75">{title}</h3>
      {children}
    </section>
  )
}

function Chips<T extends string>({ options, value, onChange, cols }: {
  options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; cols: 2 | 3
}) {
  return (
    <div className={`grid gap-2 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`} role="radiogroup">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-11 cursor-pointer rounded-xl px-2 text-[13px] font-semibold transition ${
            value === o.id ? 'bg-banorte text-white shadow-lg shadow-banorte/30' : 'bg-white/8 text-white/80 ring-1 ring-white/10 hover:bg-white/15'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-white/5 px-4 py-3 hover:bg-white/8">
      <span>
        <span className="block text-[13px] font-semibold">{label}</span>
        {hint && <span className="block text-xs text-white/50">{hint}</span>}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-white/20 transition peer-checked:bg-banorte peer-focus-visible:ring-2 peer-focus-visible:ring-white after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  )
}

const Scale = ({ left, right }: { left: string; right: string }) => (
  <div className="mt-1 flex justify-between text-[11px] text-white/40"><span>{left}</span><span>{right}</span></div>
)
const Kbd = ({ k, t }: { k: string; t: string }) => (
  <p><kbd className="mr-2 rounded-md bg-white/10 px-1.5 py-0.5 font-sans text-[11px] text-white/85">{k}</kbd>{t}</p>
)
