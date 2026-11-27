import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { config, isDemo } from './config'
import { listPhotos } from './lib/api'
import type { Photo } from './lib/types'
import { useUploader } from './hooks/useUploader'
import Logo from './components/Logo'
import HomeView from './components/HomeView'
import GalleryView from './components/GalleryView'
import BottomNav, { type Tab } from './components/BottomNav'
import Lightbox from './components/Lightbox'
import Toast, { type ToastData } from './components/Toast'

const tabFromHash = (): Tab => (location.hash === '#galeria' ? 'galeria' : 'inicio')

export default function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewer, setViewer] = useState<number | null>(null)
  const [toast, setToast] = useState<ToastData | null>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const galleryInput = useRef<HTMLInputElement>(null)

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

  const showToast = useCallback((kind: ToastData['kind'], text: string) => {
    const id = Date.now()
    setToast({ id, kind, text })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3200)
  }, [])

  const uploader = useUploader({
    onFinished: (ok, failed) => {
      if (ok) {
        showToast('ok', ok === 1 ? '¡Listo! Tu foto ya está en la galería' : `¡Listo! ${ok} fotos subidas`)
        void refresh(true)
      }
      if (failed) showToast('error', failed === 1 ? 'Una foto no se pudo subir. Toca “Reintentar”.' : `${failed} fotos no se subieron. Toca “Reintentar”.`)
    },
  })

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    if (!config.autoRefreshSeconds) return
    const id = setInterval(() => { if (!document.hidden) void refresh(true) }, config.autoRefreshSeconds * 1000)
    const onVisible = () => { if (!document.hidden) void refresh(true) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [refresh])

  const go = (t: Tab) => {
    history.replaceState(null, '', t === 'galeria' ? '#galeria' : '#inicio')
    setTab(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openCamera = () => cameraInput.current?.click()
  const openPicker = () => galleryInput.current?.click()
  const openPhoto = useCallback((i: number) => { if (config.enableLightbox) setViewer(i) }, [])
  const closeViewer = useCallback(() => setViewer(null), [])

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(env(safe-area-inset-bottom)+7rem)]">
      <header className="sticky top-0 z-20 bg-canvas/85 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => void refresh()}
            aria-label="Actualizar"
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-carbon-soft transition active:scale-95 active:bg-mist"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="px-4 pt-1">
        {isDemo && (
          <p role="status" className="mb-4 rounded-2xl bg-warn/15 px-4 py-3 text-sm text-ink ring-1 ring-warn/40">
            <b>Modo demo:</b> las fotos no se guardan en Drive.
          </p>
        )}
        {tab === 'inicio' ? (
          <HomeView
            photos={photos}
            loading={loading}
            items={uploader.items}
            busy={uploader.busy}
            onCamera={openCamera}
            onPick={openPicker}
            onStart={uploader.start}
            onRemove={uploader.remove}
            onClear={uploader.clear}
            onOpenGallery={() => go('galeria')}
            onOpenPhoto={openPhoto}
          />
        ) : (
          <GalleryView
            photos={photos}
            loading={loading}
            error={error}
            onRefresh={() => void refresh()}
            onCamera={openCamera}
            onOpenPhoto={openPhoto}
          />
        )}
      </main>

      <BottomNav tab={tab} onTab={go} onCamera={openCamera} count={photos.length} />

      {/* Cámara: la foto se sube sola. Galería: se confirma antes de subir. */}
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          uploader.add(e.target.files, true)
          e.target.value = ''
          if (tab !== 'inicio') go('inicio')
        }}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          uploader.add(e.target.files, false, config.maxFilesPerBatch)
          e.target.value = ''
        }}
      />

      <Toast toast={toast} />
      {viewer !== null && <Lightbox photos={photos} index={viewer} onIndex={setViewer} onClose={closeViewer} />}
    </div>
  )
}
