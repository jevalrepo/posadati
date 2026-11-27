import { useCallback, useEffect, useState } from 'react'
import { Camera, Images, Sparkles } from 'lucide-react'
import { config, isDemo } from './config'
import { listPhotos } from './lib/api'
import type { Photo } from './lib/types'
import UploadPanel from './components/UploadPanel'
import Gallery from './components/Gallery'

type Tab = 'subir' | 'galeria'
const tabFromHash = (): Tab => (location.hash === '#galeria' ? 'galeria' : 'subir')

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      setPhotos(await listPhotos())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    if (!config.autoRefreshSeconds) return
    const id = setInterval(() => { if (!document.hidden) void refresh(true) }, config.autoRefreshSeconds * 1000)
    return () => clearInterval(id)
  }, [refresh])

  const go = (t: Tab) => { location.hash = t === 'galeria' ? '#galeria' : '#subir' }

  return (
    <div className="min-h-dvh pb-28 sm:pb-12">
      {/* HERO */}
      <header className="relative overflow-hidden bg-banorte text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-carbon/25" />
        <div className="relative mx-auto max-w-5xl px-5 pb-14 pt-8 sm:pb-20 sm:pt-12">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-banorte"><Sparkles size={20} aria-hidden /></span>
            Banorte · Tecnología
          </div>
          <h1 className="animate-fade-up mt-8 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            {config.eventName}
          </h1>
          <p className="animate-fade-up mt-3 max-w-xl text-lg text-white/85" style={{ animationDelay: '80ms' }}>
            {config.tagline}. Sube tus fotos y revive la fiesta.
          </p>
          <nav className="mt-8 hidden gap-2 sm:flex" aria-label="Secciones">
            <TabButton active={tab === 'subir'} onClick={() => go('subir')} icon={<Camera size={18} />} label="Subir fotos" light />
            <TabButton active={tab === 'galeria'} onClick={() => go('galeria')} icon={<Images size={18} />} label={`Galería${photos.length ? ` (${photos.length})` : ''}`} light />
          </nav>
        </div>
      </header>

      <main className="relative mx-auto -mt-8 max-w-5xl px-4 sm:px-5">
        {isDemo && (
          <div role="status" className="mb-4 rounded-2xl border border-warn/40 bg-white shadow px-4 py-3 text-sm text-carbon">
            <b>Modo demo:</b> falta configurar <code className="rounded bg-white px-1">VITE_APPS_SCRIPT_URL</code>. Las fotos no se guardan en Drive.
          </div>
        )}
        {tab === 'subir' ? (
          <UploadPanel onUploaded={() => void refresh(true)} onGoGallery={() => go('galeria')} />
        ) : (
          <Gallery photos={photos} loading={loading} error={error} onRetry={() => void refresh()} onGoUpload={() => go('subir')} />
        )}
      </main>

      {/* TAB BAR MÓVIL */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-mist bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur sm:hidden"
        aria-label="Secciones"
      >
        <div className="mx-auto grid max-w-md grid-cols-2 gap-2">
          <TabButton active={tab === 'subir'} onClick={() => go('subir')} icon={<Camera size={20} />} label="Subir" />
          <TabButton active={tab === 'galeria'} onClick={() => go('galeria')} icon={<Images size={20} />} label="Galería" />
        </div>
      </nav>
    </div>
  )
}

function TabButton({ active, onClick, icon, label, light }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; light?: boolean
}) {
  const base = 'flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition-colors'
  const style = light
    ? active ? 'bg-white text-banorte shadow-lg' : 'bg-white/15 text-white hover:bg-white/25'
    : active ? 'bg-banorte text-white' : 'text-carbon-soft hover:bg-mist'
  return (
    <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`${base} ${style}`}>
      {icon}{label}
    </button>
  )
}
