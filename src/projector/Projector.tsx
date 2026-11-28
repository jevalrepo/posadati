import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { ChevronLeft, ChevronRight, Maximize, Minimize, Pause, Play, Settings2 } from 'lucide-react'
import { listPhotos, sizedUrl } from '../lib/api'
import type { Photo } from '../lib/types'
import { COLOR_FX, useSettings, type Transition } from './settings'
import SettingsPanel from './SettingsPanel'

interface Slide { key: number; photo: Photo; fx: Transition; isNew: boolean; kb: 'a' | 'b' }

const REFRESH_MS = 15000
const ALL_FX: Transition[] = ['fade', 'slide', 'zoom', 'blur', 'flip', 'rise']
const uploadUrl = () => `${location.origin}${import.meta.env.BASE_URL}#inicio`
const imgUrl = (p: Photo) => sizedUrl(p, Math.min(3840, Math.round(window.innerWidth * (window.devicePixelRatio || 1))))

function shuffle<T>(a: T[]) {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

/** Precarga la imagen; resuelve aunque falle o tarde, para no detener la presentación. */
function preload(url: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    const t = setTimeout(resolve, 8000)
    img.onload = img.onerror = () => { clearTimeout(t); resolve() }
    img.src = url
  })
}

export default function Projector() {
  const { settings: s, update, reset } = useSettings()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [current, setCurrent] = useState<Slide | null>(null)
  const [previous, setPrevious] = useState<Slide | null>(null)
  const [playing, setPlaying] = useState(true)
  const [panel, setPanel] = useState(false)
  const [idle, setIdle] = useState(false)
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement)
  const [qr, setQr] = useState('')

  const byId = useRef(new Map<string, Photo>())
  const seen = useRef<Set<string> | null>(null)
  const fresh = useRef<string[]>([])
  const playlist = useRef<string[]>([])
  const pos = useRef(0)
  const shown = useRef<string[]>([])
  const keyRef = useRef(0)
  const currentRef = useRef<Slide | null>(null)
  const busy = useRef(false)
  const sRef = useRef(s)
  sRef.current = s

  useEffect(() => { document.title = 'Proyector · Posada TI 2026' }, [])
  useEffect(() => {
    QRCode.toDataURL(uploadUrl(), { margin: 1, width: 360, color: { dark: '#1b232a', light: '#ffffff' } }).then(setQr).catch(() => setQr(''))
  }, [])

  // --- Datos ---
  const refresh = useCallback(async () => {
    try {
      const list = await listPhotos()
      byId.current = new Map(list.map((p) => [p.id, p]))
      if (!seen.current) {
        seen.current = new Set(list.map((p) => p.id))
      } else {
        const nuevos = list.filter((p) => !seen.current!.has(p.id))
        nuevos.forEach((p) => seen.current!.add(p.id))
        if (sRef.current.prioritizeNew) fresh.current.push(...nuevos.map((p) => p.id).reverse())
      }
      setPhotos(list)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión')
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const id = setInterval(() => void refresh(), REFRESH_MS)
    return () => clearInterval(id)
  }, [refresh])

  // Lista de reproducción según el orden elegido
  useEffect(() => {
    const ids = photos.map((p) => p.id) // ya vienen de la más reciente a la más antigua
    playlist.current = s.order === 'oldest' ? ids.reverse() : s.order === 'random' ? shuffle(ids) : ids
    const cur = currentRef.current?.photo.id
    const i = cur ? playlist.current.indexOf(cur) : -1
    pos.current = i >= 0 ? i + 1 : 0
  }, [photos, s.order])

  // --- Reproducción ---
  const show = useCallback(async (photo: Photo, isNew: boolean, remember = true) => {
    if (busy.current) return
    busy.current = true
    await preload(imgUrl(photo))
    const cfg = sRef.current
    const fx = cfg.transition === 'random' ? ALL_FX[Math.floor(Math.random() * ALL_FX.length)] : cfg.transition
    const slide: Slide = { key: ++keyRef.current, photo, fx, isNew, kb: keyRef.current % 2 ? 'a' : 'b' }
    setPrevious(currentRef.current)
    currentRef.current = slide
    setCurrent(slide)
    if (remember) shown.current = [...shown.current.slice(-200), photo.id]
    busy.current = false
  }, [])

  const next = useCallback(() => {
    let id = fresh.current.shift()
    const isNew = !!id
    if (!id) {
      if (!playlist.current.length) return
      if (pos.current >= playlist.current.length) {
        pos.current = 0
        if (sRef.current.order === 'random') playlist.current = shuffle(playlist.current)
      }
      id = playlist.current[pos.current++]
    }
    const photo = byId.current.get(id)
    if (photo) void show(photo, isNew)
  }, [show])

  const prev = useCallback(() => {
    if (shown.current.length < 2) return
    shown.current.pop()
    const id = shown.current[shown.current.length - 1]
    const photo = byId.current.get(id)
    const i = playlist.current.indexOf(id)
    if (i >= 0) pos.current = i + 1
    if (photo) void show(photo, false, false)
  }, [show])

  // Primera foto en cuanto haya datos
  useEffect(() => { if (!current && photos.length) next() }, [photos, current, next])

  // Avance automático
  useEffect(() => {
    if (!playing || !current) return
    const t = setTimeout(next, s.interval * 1000)
    return () => clearTimeout(t)
  }, [current, playing, s.interval, next])

  // Retira la capa anterior al terminar la transición
  useEffect(() => {
    if (!previous) return
    const t = setTimeout(() => setPrevious(null), s.speed + 50)
    return () => clearTimeout(t)
  }, [previous, s.speed])

  // --- Pantalla completa, inactividad y teclado ---
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.()
  }, [])
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const wake = () => {
      setIdle(false)
      clearTimeout(t)
      t = setTimeout(() => setIdle(true), 3000)
    }
    wake()
    window.addEventListener('mousemove', wake)
    window.addEventListener('keydown', wake)
    return () => { clearTimeout(t); window.removeEventListener('mousemove', wake); window.removeEventListener('keydown', wake) }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'range') return
      const k = e.key.toLowerCase()
      if (k === ' ') { e.preventDefault(); setPlaying((p) => !p) }
      else if (k === 'arrowright') next()
      else if (k === 'arrowleft') prev()
      else if (k === 'f') toggleFullscreen()
      else if (k === 's') setPanel((p) => !p)
      else if (k === 'escape') setPanel(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, toggleFullscreen])

  const colorCss = useMemo(() => COLOR_FX.find((c) => c.id === s.colorFx)?.css ?? 'none', [s.colorFx])
  const chrome = !idle || panel || !playing
  const index = current ? photos.findIndex((p) => p.id === current.photo.id) : -1

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-black text-white select-none ${chrome ? '' : 'cursor-none'}`}
      style={{ ['--speed' as string]: `${s.speed}ms` }}
    >
      {/* CAPAS DE FOTOS (contexto propio para que nunca tapen los textos) */}
      <div className="absolute inset-0 isolate z-0" style={{ perspective: '2000px' }}>
        {previous && <Layer slide={previous} mode="out" fit={s.fit} colorCss={colorCss} kenBurns={s.kenBurns} interval={s.interval} speed={s.speed} />}
        {current && <Layer slide={current} mode="in" fit={s.fit} colorCss={colorCss} kenBurns={s.kenBurns} interval={s.interval} speed={s.speed} />}
        {/* Viñeta para legibilidad de los textos */}
        <div className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,.55))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-48 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* ESTADOS VACÍO / ERROR */}
      {(!current || !photos.length) && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-[radial-gradient(circle_at_30%_20%,#3a1520,transparent_55%),radial-gradient(circle_at_80%_90%,#1f2a33,transparent_50%)] bg-ink">
          <div className="flex items-center gap-16 px-10">
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-[.3em] text-white/50">Posada TI 2026</p>
              <h1 className="mt-4 text-6xl font-extrabold leading-[1.05] tracking-tight">
                {!loaded ? 'Cargando fotos…' : error ? 'No pudimos cargar las fotos' : 'Comparte la magia de la posada'}
              </h1>
              <p className="mt-6 text-2xl text-white/65">
                {error ? error : 'Escanea el código con tu celular y sube la primera foto. Aparecerá aquí al instante.'}
              </p>
            </div>
            {qr && !error && (
              <div className="shrink-0 rounded-[32px] bg-white p-6 shadow-2xl">
                <img src={qr} alt="Código QR para subir fotos" className="h-72 w-72" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* MARCA Y CONTADOR */}
      {s.showInfo && current && (
        <div className="pointer-events-none absolute left-10 top-9 z-10 flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-banorte shadow-xl shadow-black/40">
            <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden><path d="M12 2.5l2.35 6.4 6.65.35-5.2 4.15 1.8 6.6L12 16.2 6.4 20l1.8-6.6L3 9.25l6.65-.35z" fill="#fff" /></svg>
          </span>
          <div className="leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,.6)]">
            <p className="text-2xl font-extrabold tracking-tight">Posada TI</p>
            <p className="mt-1 text-sm font-bold tracking-[.25em] text-white/80">2026</p>
          </div>
        </div>
      )}

      {current && (s.showInfo || current.isNew) && (
        <div className="pointer-events-none absolute bottom-10 left-10 z-10 flex items-center gap-3">
          {current.isNew && (
            <span key={current.key} className="animate-pop rounded-full bg-banorte px-5 py-2 text-lg font-extrabold uppercase tracking-wide" style={{ animation: 'pop .4s both, badge-pulse 1.6s 3' }}>
              ¡Nueva foto!
            </span>
          )}
          {s.showInfo && index >= 0 && (
            <span className="rounded-full bg-black/45 px-4 py-2 text-base font-semibold text-white/90 backdrop-blur-md">
              {index + 1} / {photos.length}
            </span>
          )}
        </div>
      )}

      {/* QR */}
      {s.showQr && qr && current && (
        <div className="absolute bottom-10 right-10 z-10 flex items-center gap-4 rounded-3xl bg-white/95 p-3 pr-6 text-ink shadow-2xl backdrop-blur">
          <img src={qr} alt="Código QR para subir fotos" className="h-32 w-32 rounded-xl" />
          <div className="max-w-44">
            <p className="text-lg font-extrabold leading-tight">¡Sube tus fotos!</p>
            <p className="mt-1 text-sm text-carbon-soft">Escanea con tu celular</p>
          </div>
        </div>
      )}

      {/* PROGRESO */}
      {current && (
        <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-white/10">
          <div
            key={`${current.key}-${s.interval}`}
            className="h-full origin-left bg-banorte"
            style={{ animation: `progress ${s.interval}s linear both`, animationPlayState: playing ? 'running' : 'paused' }}
          />
        </div>
      )}

      {/* CONTROLES */}
      <div
        className={`absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/55 p-1.5 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition-all duration-300 ${
          chrome ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        }`}
      >
        <Ctl label="Anterior (←)" onClick={prev}><ChevronLeft size={22} /></Ctl>
        <Ctl label={playing ? 'Pausar (espacio)' : 'Reproducir (espacio)'} onClick={() => setPlaying((p) => !p)} primary>
          {playing ? <Pause size={22} /> : <Play size={22} className="translate-x-0.5" />}
        </Ctl>
        <Ctl label="Siguiente (→)" onClick={next}><ChevronRight size={22} /></Ctl>
        <span className="mx-1 h-6 w-px bg-white/15" />
        <Ctl label="Ajustes (S)" onClick={() => setPanel((p) => !p)} active={panel}><Settings2 size={20} /></Ctl>
        <Ctl label="Pantalla completa (F)" onClick={toggleFullscreen}>{fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</Ctl>
      </div>

      {!playing && current && (
        <div className="pointer-events-none absolute right-10 top-9 z-10 rounded-full bg-black/55 px-4 py-2 text-sm font-semibold backdrop-blur-md">
          En pausa
        </div>
      )}

      {panel && <SettingsPanel settings={s} update={update} reset={reset} onClose={() => setPanel(false)} />}
    </div>
  )
}

function Layer({ slide, mode, fit, colorCss, kenBurns, interval, speed }: {
  slide: Slide; mode: 'in' | 'out'; fit: 'contain' | 'cover'; colorCss: string; kenBurns: boolean; interval: number; speed: number
}) {
  const url = imgUrl(slide.photo)
  return (
    <div
      className={`fx-layer fx-${mode}-${slide.fx} absolute inset-0 overflow-hidden`}
      style={{ zIndex: mode === 'in' ? 2 : 1, backfaceVisibility: 'hidden' }}
    >
      {/* El filtro de color va en una capa interna para no chocar con las transiciones que animan "filter" */}
      <div className="absolute inset-0" style={{ filter: colorCss === 'none' ? undefined : colorCss }}>
      {fit === 'contain' && (
        <img src={url} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-3xl" aria-hidden />
      )}
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        draggable={false}
        className={`absolute inset-0 h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,.6)]'}`}
        style={kenBurns ? { animation: `kenburns-${slide.kb} ${interval + speed / 1000 + 1}s ease-out both` } : undefined}
      />
      </div>
    </div>
  )
}

function Ctl({ label, onClick, children, primary, active }: {
  label: string; onClick: () => void; children: React.ReactNode; primary?: boolean; active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid cursor-pointer place-items-center rounded-full transition ${
        primary ? 'h-14 w-14 bg-banorte hover:bg-banorte-dark' : `h-12 w-12 hover:bg-white/15 ${active ? 'bg-white/20' : ''}`
      }`}
    >
      {children}
    </button>
  )
}
