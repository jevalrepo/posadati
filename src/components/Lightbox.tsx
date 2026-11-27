import { useEffect, useRef, useState } from 'react'
import { Download, X } from 'lucide-react'
import { config } from '../config'
import { downloadUrl, fullUrl, thumbUrl } from '../lib/api'
import type { Photo } from '../lib/types'

interface Props { photos: Photo[]; index: number; onIndex: (i: number) => void; onClose: () => void }

export default function Lightbox({ photos, index, onIndex, onClose }: Props) {
  const photo = photos[index]
  const start = useRef<{ x: number; y: number } | null>(null)
  const [dx, setDx] = useState(0)
  const [hiRes, setHiRes] = useState(false)

  const go = (d: number) => {
    const n = index + d
    if (n >= 0 && n < photos.length) onIndex(n)
  }

  useEffect(() => { setHiRes(false) }, [index])
  useEffect(() => {
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // botón "atrás" del celular cierra el visor
    history.pushState({ lightbox: true }, '')
    const onPop = () => onClose()
    window.addEventListener('popstate', onPop)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onPop)
      if (history.state?.lightbox) history.back()
    }
  }, [onClose])

  if (!photo) return null
  const btn = 'grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white/12 text-white backdrop-blur-md transition active:scale-95 active:bg-white/25'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visor de fotos"
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onTouchStart={(e) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
      onTouchMove={(e) => { if (start.current) setDx(e.touches[0].clientX - start.current.x) }}
      onTouchEnd={(e) => {
        if (!start.current) return
        const x = e.changedTouches[0].clientX - start.current.x
        const y = e.changedTouches[0].clientY - start.current.y
        if (Math.abs(x) > 60 && Math.abs(x) > Math.abs(y)) go(x > 0 ? -1 : 1)
        else if (y > 110 && Math.abs(y) > Math.abs(x)) onClose()
        start.current = null
        setDx(0)
      }}
    >
      <div className="flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <button type="button" onClick={onClose} aria-label="Cerrar" className={btn}><X size={22} /></button>
        <span className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-md">
          {index + 1} de {photos.length}
        </span>
        {config.allowDownload ? (
          <a href={downloadUrl(photo)} target="_blank" rel="noreferrer" aria-label="Descargar foto" className={btn}><Download size={20} /></a>
        ) : <span className="w-12" />}
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <img
          key={photo.id}
          src={hiRes ? fullUrl(photo) : thumbUrl(photo, 1000)}
          onLoad={() => setHiRes(true)}
          alt={`Foto ${index + 1}`}
          referrerPolicy="no-referrer"
          className="animate-pop max-h-full max-w-full object-contain"
          style={{ transform: `translateX(${dx}px)`, transition: dx ? 'none' : 'transform .25s ease' }}
          draggable={false}
        />
      </div>

      <p className="pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 text-center text-xs text-white/45">
        Desliza para ver más · Desliza hacia abajo para cerrar
      </p>
    </div>
  )
}
