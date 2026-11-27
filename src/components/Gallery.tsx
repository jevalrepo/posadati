import { useState } from 'react'
import { Camera, CloudOff, RefreshCw } from 'lucide-react'
import { config } from '../config'
import { thumbUrl } from '../lib/api'
import type { Photo } from '../lib/types'
import Lightbox from './Lightbox'

interface Props {
  photos: Photo[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onGoUpload: () => void
}

export default function Gallery({ photos, loading, error, onRetry, onGoUpload }: Props) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="animate-fade-up rounded-3xl bg-white p-4 shadow-xl shadow-carbon/10 sm:p-8" aria-labelledby="gal-h">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="gal-h" className="text-2xl font-bold">Galería</h2>
          <p className="text-sm text-carbon-soft">{photos.length} foto{photos.length === 1 ? '' : 's'}</p>
        </div>
        <button type="button" onClick={onRetry} aria-label="Actualizar galería"
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-carbon-soft transition hover:bg-mist">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mt-5">
        {loading && photos.length === 0 ? (
          <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
            {[160, 220, 190, 250, 170, 210].map((h, i) => (
              <div key={i} className="skeleton mb-3 rounded-2xl" style={{ height: h }} />
            ))}
          </div>
        ) : error && photos.length === 0 ? (
          <Empty icon={<CloudOff size={36} />} title="No pudimos cargar las fotos" text={error}
            action={<button type="button" onClick={onRetry} className="min-h-12 cursor-pointer rounded-2xl bg-banorte px-6 font-semibold text-white hover:bg-banorte-dark">Reintentar</button>} />
        ) : photos.length === 0 ? (
          <Empty icon={<Camera size={36} />} title="Aún no hay fotos" text="Sé el primero en compartir un momento de la posada."
            action={<button type="button" onClick={onGoUpload} className="min-h-12 cursor-pointer rounded-2xl bg-banorte px-6 font-semibold text-white hover:bg-banorte-dark">Subir una foto</button>} />
        ) : (
          <ul className="columns-2 gap-3 sm:columns-3 md:columns-4">
            {photos.map((p, i) => (
              <li key={p.id} className="mb-3 break-inside-avoid">
                <button type="button" disabled={!config.enableLightbox} onClick={() => setOpen(i)}
                  className="group block w-full cursor-pointer overflow-hidden rounded-2xl bg-mist ring-banorte transition hover:shadow-lg disabled:cursor-default">
                  <img src={thumbUrl(p)} alt={`Foto ${p.name}`} loading="lazy" referrerPolicy="no-referrer"
                    className="w-full transition duration-300 group-hover:scale-[1.03]" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  )
}

function Empty({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-14 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-banorte-soft text-banorte">{icon}</div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-carbon-soft">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  )
}
