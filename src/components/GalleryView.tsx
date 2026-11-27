import { Camera, CloudOff } from 'lucide-react'
import type { Photo } from '../lib/types'
import Thumb from './Thumb'

interface Props {
  photos: Photo[]
  loading: boolean
  error: string | null
  onRefresh: () => void
  onCamera: () => void
  onOpenPhoto: (index: number) => void
}

export default function GalleryView({ photos, loading, error, onRefresh, onCamera, onOpenPhoto }: Props) {
  return (
    <div className="animate-fade-up">
      <div className="flex items-end justify-between px-1">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight">Galería</h1>
          <p className="text-[13px] text-carbon-soft">
            {photos.length} foto{photos.length === 1 ? '' : 's'} de la posada
          </p>
        </div>
      </div>

      <div className="mt-4">
        {loading && !photos.length ? (
          <div className="columns-2 gap-2">
            {[190, 240, 210, 260, 180, 230].map((h, i) => <div key={i} className="skeleton mb-2 rounded-2xl" style={{ height: h }} />)}
          </div>
        ) : error && !photos.length ? (
          <Empty
            icon={<CloudOff size={30} />}
            title="No pudimos cargar las fotos"
            text={error}
            action={<button type="button" onClick={onRefresh} className="min-h-12 cursor-pointer rounded-2xl bg-banorte px-6 font-bold text-white active:bg-banorte-dark">Reintentar</button>}
          />
        ) : !photos.length ? (
          <Empty
            icon={<Camera size={30} />}
            title="Aún no hay fotos"
            text="Sé el primero en compartir un momento de la posada."
            action={<button type="button" onClick={onCamera} className="min-h-12 cursor-pointer rounded-2xl bg-banorte px-6 font-bold text-white active:bg-banorte-dark">Tomar una foto</button>}
          />
        ) : (
          <ul className="columns-2 gap-2">
            {photos.map((p, i) => (
              <li key={p.id} className="mb-2 break-inside-avoid">
                <button
                  type="button"
                  onClick={() => onOpenPhoto(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className="block w-full cursor-pointer overflow-hidden rounded-2xl ring-1 ring-black/5 transition active:scale-[.97]"
                >
                  <Thumb photo={p} width={500} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Empty({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-black/5">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-banorte-soft text-banorte">{icon}</div>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-carbon-soft">{text}</p>
      <div className="mt-6">{action}</div>
    </div>
  )
}
