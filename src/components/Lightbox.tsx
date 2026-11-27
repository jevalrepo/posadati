import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { config } from '../config'
import { downloadUrl, fullUrl } from '../lib/api'
import type { Photo } from '../lib/types'

interface Props { photos: Photo[]; index: number; onIndex: (i: number) => void; onClose: () => void }

export default function Lightbox({ photos, index, onIndex, onClose }: Props) {
  const photo = photos[index]
  const touchX = useRef<number | null>(null)
  const prev = () => onIndex((index - 1 + photos.length) % photos.length)
  const next = () => onIndex((index + 1) % photos.length)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow }
  })

  if (!photo) return null
  const btn = 'grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25'

  return (
    <div role="dialog" aria-modal="true" aria-label="Visor de fotos"
      className="fixed inset-0 z-50 flex flex-col bg-carbon/95 animate-fade-up"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 60) (dx > 0 ? prev : next)()
        touchX.current = null
      }}>
      <div className="flex items-center justify-between p-3 text-white">
        <span className="px-2 text-sm text-white/70">{index + 1} / {photos.length}</span>
        <div className="flex gap-2">
          {config.allowDownload && (
            <a href={downloadUrl(photo)} download target="_blank" rel="noreferrer" aria-label="Descargar foto" className={btn}><Download size={20} /></a>
          )}
          <button type="button" onClick={onClose} aria-label="Cerrar" className={btn}><X size={22} /></button>
        </div>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-6" onClick={onClose}>
        <img key={photo.id} src={fullUrl(photo)} alt={`Foto ${photo.name}`} referrerPolicy="no-referrer"
          onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Anterior" className={`${btn} absolute left-3 hidden sm:grid`}><ChevronLeft /></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); next() }} aria-label="Siguiente" className={`${btn} absolute right-3 hidden sm:grid`}><ChevronRight /></button>
          </>
        )}
      </div>
    </div>
  )
}
