import { useRef, useState } from 'react'
import { AlertCircle, Camera, CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react'
import { config } from '../config'
import { uploadPhoto } from '../lib/api'

type Status = 'pending' | 'uploading' | 'done' | 'error'
interface Item { id: string; file: File; preview: string; status: Status; error?: string }

export default function UploadPanel({ onUploaded, onGoGallery }: { onUploaded: () => void; onGoGallery: () => void }) {
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const galleryInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)

  const add = (list: FileList | File[] | null) => {
    if (!list) return
    const files = Array.from(list).filter((f) => f.type.startsWith('image/')).slice(0, config.maxFilesPerBatch)
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file), status: 'pending' as Status })),
    ])
  }
  const patch = (id: string, p: Partial<Item>) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)))
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const send = async () => {
    setBusy(true)
    for (const it of items.filter((i) => i.status === 'pending' || i.status === 'error')) {
      patch(it.id, { status: 'uploading', error: undefined })
      try {
        await uploadPhoto(it.file)
        patch(it.id, { status: 'done' })
      } catch (e) {
        patch(it.id, { status: 'error', error: e instanceof Error ? e.message : 'Error' })
      }
    }
    setBusy(false)
    onUploaded()
  }

  const todo = items.filter((i) => i.status === 'pending' || i.status === 'error').length
  const done = items.filter((i) => i.status === 'done').length
  const allDone = items.length > 0 && todo === 0 && !busy

  return (
    <section className="animate-fade-up rounded-3xl bg-white p-5 shadow-xl shadow-carbon/10 sm:p-8" aria-labelledby="subir-h">
      <h2 id="subir-h" className="text-2xl font-bold">Sube tus fotos</h2>
      <p className="mt-1 text-carbon-soft">Toma una foto ahora o elige varias de tu galería.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => cameraInput.current?.click()}
          className="flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl bg-banorte px-6 text-left text-white shadow-lg shadow-banorte/30 transition hover:bg-banorte-dark active:scale-[.98]"
        >
          <Camera size={32} aria-hidden />
          <span><span className="block text-lg font-bold">Tomar foto</span><span className="text-sm text-white/80">Usar la cámara</span></span>
        </button>
        <button
          type="button"
          onClick={() => galleryInput.current?.click()}
          className="flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border-2 border-carbon/15 bg-white px-6 text-left transition hover:border-banorte hover:bg-banorte-soft active:scale-[.98]"
        >
          <ImagePlus size={32} className="text-banorte" aria-hidden />
          <span><span className="block text-lg font-bold">Subir de galería</span><span className="text-sm text-carbon-soft">Desde tu dispositivo</span></span>
        </button>
      </div>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { add(e.target.files); e.target.value = '' }} />
      <input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = '' }} />

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files) }}
        className={`mt-4 hidden rounded-2xl border-2 border-dashed p-6 text-center text-sm transition sm:block ${drag ? 'border-banorte bg-banorte-soft text-banorte' : 'border-carbon/15 text-carbon-soft'}`}
      >
        o arrastra tus fotos aquí
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {items.map((it) => (
              <li key={it.id} className="relative aspect-square overflow-hidden rounded-xl bg-mist">
                <img src={it.preview} alt="" className="h-full w-full object-cover" />
                {it.status !== 'pending' && (
                  <div className={`absolute inset-0 grid place-items-center ${it.status === 'done' ? 'bg-ok/70' : it.status === 'error' ? 'bg-banorte/75' : 'bg-carbon/55'} text-white`} title={it.error}>
                    {it.status === 'uploading' && <Loader2 className="animate-spin" aria-label="Subiendo" />}
                    {it.status === 'done' && <CheckCircle2 aria-label="Subida" />}
                    {it.status === 'error' && <AlertCircle aria-label="Error" />}
                  </div>
                )}
                {!busy && it.status !== 'done' && (
                  <button type="button" onClick={() => remove(it.id)} aria-label="Quitar foto"
                    className="absolute right-1 top-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-carbon/80 text-white hover:bg-carbon">
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-carbon-soft" aria-live="polite">
              {busy ? `Subiendo… ${done}/${items.length}` : allDone ? '¡Listo! Tus fotos ya están en la galería.' : `${items.length} foto${items.length > 1 ? 's' : ''} lista${items.length > 1 ? 's' : ''}`}
            </p>
            {allDone ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => setItems([])} className="min-h-12 cursor-pointer rounded-2xl px-5 font-semibold text-carbon-soft hover:bg-mist">Subir más</button>
                <button type="button" onClick={onGoGallery} className="min-h-12 cursor-pointer rounded-2xl bg-carbon px-6 font-semibold text-white hover:bg-carbon/90">Ver galería</button>
              </div>
            ) : (
              <button type="button" onClick={send} disabled={busy || todo === 0}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-banorte px-8 font-bold text-white shadow-lg shadow-banorte/30 transition hover:bg-banorte-dark disabled:cursor-not-allowed disabled:opacity-50">
                {busy && <Loader2 size={18} className="animate-spin" />}
                {busy ? 'Subiendo…' : `Subir ${todo} foto${todo > 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
