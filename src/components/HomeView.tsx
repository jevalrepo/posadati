import { AlertCircle, ArrowRight, Camera, CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react'
import type { UploadItem } from '../hooks/useUploader'
import type { Photo } from '../lib/types'
import Thumb from './Thumb'

interface Props {
  photos: Photo[]
  loading: boolean
  items: UploadItem[]
  busy: boolean
  onCamera: () => void
  onPick: () => void
  onStart: () => void
  onRemove: (id: string) => void
  onClear: () => void
  onOpenGallery: () => void
  onOpenPhoto: (index: number) => void
}

export default function HomeView(p: Props) {
  const ready = p.items.filter((i) => i.status === 'ready' || i.status === 'error').length
  const inFlight = p.items.filter((i) => i.status === 'pending' || i.status === 'uploading').length
  const recent = p.photos.slice(0, 10)

  return (
    <div className="space-y-5">
      {/* TARJETA PRINCIPAL */}
      <section className="animate-fade-up relative overflow-hidden rounded-[28px] bg-gradient-to-br from-carbon via-[#28323a] to-ink px-5 pb-5 pt-6 text-white shadow-xl shadow-ink/20">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-banorte/35 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-banorte/15 blur-3xl" aria-hidden />
        <Sparkles />

        <p className="relative text-[11px] font-bold uppercase tracking-[.22em] text-white/55">Galería del evento</p>
        <h1 className="relative mt-2 text-[27px] font-extrabold leading-[1.12] tracking-tight">
          Comparte la<br />magia de la{' '}
          <span className="relative inline-block">
            posada
            <svg viewBox="0 0 120 12" className="absolute -bottom-1.5 left-0 h-2.5 w-full" preserveAspectRatio="none" aria-hidden>
              <path d="M2 9C30 3 70 2 118 6" stroke="#EB0029" strokeWidth="5" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className="relative mt-3 text-[14px] leading-relaxed text-white/70">
          Toma una foto y aparecerá al instante en la galería de todos.
        </p>

        <div className="relative mt-5 flex flex-col items-center">
          <button
            type="button"
            onClick={p.onCamera}
            aria-label="Tomar foto"
            className="pulse-ring relative grid h-[92px] w-[92px] cursor-pointer place-items-center rounded-full bg-white/10 ring-1 ring-white/25 backdrop-blur transition active:scale-95"
          >
            <span className="grid h-[74px] w-[74px] place-items-center rounded-full bg-banorte shadow-lg shadow-banorte/40">
              <Camera size={32} strokeWidth={2.2} aria-hidden />
            </span>
          </button>
          <p className="mt-2.5 text-sm font-bold">Tomar foto</p>
        </div>

        <button
          type="button"
          onClick={p.onPick}
          className="relative mt-5 flex min-h-13 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-white/10 text-[15px] font-semibold ring-1 ring-white/15 transition active:scale-[.98] active:bg-white/15"
        >
          <ImagePlus size={20} aria-hidden /> Elegir de mi galería
        </button>
      </section>

      {/* COLA DE SUBIDA */}
      {p.items.length > 0 && (
        <section className="animate-fade-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5" aria-labelledby="cola-h">
          <div className="flex items-center justify-between">
            <h2 id="cola-h" className="text-[15px] font-bold">
              {inFlight ? 'Subiendo fotos…' : ready ? 'Listas para subir' : '¡Fotos subidas!'}
            </h2>
            {!p.busy && (
              <button type="button" onClick={p.onClear} className="min-h-10 cursor-pointer px-2 text-sm font-semibold text-carbon-soft">
                Limpiar
              </button>
            )}
          </div>
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {p.items.map((it) => (
              <li key={it.id} className="animate-pop relative aspect-square overflow-hidden rounded-xl bg-mist">
                <img src={it.preview} alt="" className="h-full w-full object-cover" />
                {it.status !== 'ready' && (
                  <div
                    className={`absolute inset-0 grid place-items-center text-white ${
                      it.status === 'done' ? 'bg-ink/35' : it.status === 'error' ? 'bg-banorte/75' : 'bg-ink/50'
                    }`}
                  >
                    {(it.status === 'uploading' || it.status === 'pending') && (
                      <Loader2 size={22} className={it.status === 'uploading' ? 'animate-spin' : 'opacity-60'} aria-label="Subiendo" />
                    )}
                    {it.status === 'done' && <span className="animate-pop grid h-9 w-9 place-items-center rounded-full bg-ok shadow-lg"><CheckCircle2 size={20} aria-label="Subida" /></span>}
                    {it.status === 'error' && <AlertCircle size={24} aria-label={it.error ?? 'Error'} />}
                  </div>
                )}
                {(it.status === 'ready' || it.status === 'error') && !p.busy && (
                  <button
                    type="button"
                    onClick={() => p.onRemove(it.id)}
                    aria-label="Quitar foto"
                    className="absolute right-1 top-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-ink/75 text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {ready > 0 && !p.busy && (
            <button
              type="button"
              onClick={p.onStart}
              className="mt-4 flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-banorte text-base font-bold text-white shadow-lg shadow-banorte/30 transition active:scale-[.98] active:bg-banorte-dark"
            >
              {p.items.some((i) => i.status === 'error') ? 'Reintentar' : 'Subir'} {ready} foto{ready > 1 ? 's' : ''}
            </button>
          )}
        </section>
      )}

      {/* RECIENTES */}
      <section className="animate-fade-up" style={{ animationDelay: '80ms' }} aria-labelledby="rec-h">
        <div className="flex items-end justify-between px-1">
          <div>
            <h2 id="rec-h" className="text-lg font-extrabold tracking-tight">Lo más reciente</h2>
            <p className="text-[13px] text-carbon-soft">
              {p.photos.length ? `${p.photos.length} foto${p.photos.length > 1 ? 's' : ''} compartida${p.photos.length > 1 ? 's' : ''}` : 'Aún no hay fotos'}
            </p>
          </div>
          {p.photos.length > 0 && (
            <button type="button" onClick={p.onOpenGallery} className="flex min-h-10 cursor-pointer items-center gap-1 text-sm font-bold text-banorte">
              Ver todo <ArrowRight size={16} aria-hidden />
            </button>
          )}
        </div>

        <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
          {p.loading && !p.photos.length ? (
            [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-36 w-28 shrink-0 rounded-2xl" />)
          ) : recent.length ? (
            recent.map((ph, i) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => p.onOpenPhoto(i)}
                className="h-36 w-28 shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl ring-1 ring-black/5 transition active:scale-95"
                aria-label={`Ver foto ${i + 1}`}
              >
                <Thumb photo={ph} width={300} fill />
              </button>
            ))
          ) : (
            <div className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-carbon/15 px-4 py-5 text-sm text-carbon-soft">
              <Camera size={22} className="shrink-0 text-banorte" aria-hidden />
              Sé el primero en compartir un momento.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function Sparkles() {
  const stars = [
    { x: '78%', y: '18%', s: 14, o: 0.5 },
    { x: '88%', y: '40%', s: 8, o: 0.35 },
    { x: '66%', y: '8%', s: 7, o: 0.3 },
    { x: '10%', y: '62%', s: 9, o: 0.25 },
  ]
  return (
    <>
      {stars.map((st, i) => (
        <svg key={i} viewBox="0 0 24 24" className="pointer-events-none absolute" style={{ left: st.x, top: st.y, width: st.s, height: st.s, opacity: st.o }} aria-hidden>
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" fill="#fff" />
        </svg>
      ))}
    </>
  )
}
