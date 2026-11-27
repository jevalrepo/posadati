import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { thumbUrl } from '../lib/api'
import type { Photo } from '../lib/types'

/** Miniatura con esqueleto y reintentos: Drive tarda unos segundos en generar la de una foto recién subida. */
export default function Thumb({ photo, width = 600, className = '', fill = false }: {
  photo: Photo; width?: number; className?: string; fill?: boolean
}) {
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => { setAttempt(0); setLoaded(false); setFailed(false) }, [photo.id])

  const onError = () => {
    if (attempt < 4) setTimeout(() => setAttempt((a) => a + 1), 2500 * (attempt + 1))
    else setFailed(true)
  }

  const src = thumbUrl(photo, width) + (attempt && !photo.src ? `&r=${attempt}` : '')

  return (
    <div className={`relative overflow-hidden bg-mist ${!loaded && !failed ? 'skeleton' : ''} ${fill ? 'h-full w-full' : !loaded ? 'min-h-40' : ''} ${className}`}>
      {failed ? (
        <div className="grid h-full min-h-32 place-items-center text-carbon-soft/60"><ImageOff size={22} aria-hidden /></div>
      ) : (
        <img
          key={attempt}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={onError}
          className={`block w-full transition-opacity duration-500 ${fill ? 'h-full object-cover' : ''} ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
