import { useCallback, useReducer, useRef } from 'react'
import { uploadPhoto } from '../lib/api'

export type Status = 'ready' | 'pending' | 'uploading' | 'done' | 'error'
export interface UploadItem { id: string; file: File; preview: string; status: Status; error?: string }

interface Options {
  onFinished: (ok: number, failed: number) => void
}

/** Cola de subida. "ready" espera confirmación; "pending" se sube en cuanto hay turno. */
export function useUploader({ onFinished }: Options) {
  const items = useRef<UploadItem[]>([])
  const running = useRef(false)
  const [, render] = useReducer((x: number) => x + 1, 0)
  const finished = useRef(onFinished)
  finished.current = onFinished

  const update = (fn: (list: UploadItem[]) => UploadItem[]) => {
    items.current = fn(items.current)
    render()
  }
  const patch = (id: string, p: Partial<UploadItem>) =>
    update((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i)))

  const run = useCallback(async () => {
    if (running.current) return
    running.current = true
    render()
    let ok = 0
    let failed = 0
    for (;;) {
      const next = items.current.find((i) => i.status === 'pending')
      if (!next) break
      patch(next.id, { status: 'uploading', error: undefined })
      try {
        await uploadPhoto(next.file)
        patch(next.id, { status: 'done' })
        ok++
      } catch (e) {
        patch(next.id, { status: 'error', error: e instanceof Error ? e.message : 'Error al subir' })
        failed++
      }
    }
    running.current = false
    render()
    finished.current(ok, failed)
    // Las subidas exitosas se retiran de la cola tras un momento
    if (ok) setTimeout(() => update((list) => {
      list.filter((i) => i.status === 'done').forEach((i) => URL.revokeObjectURL(i.preview))
      return list.filter((i) => i.status !== 'done')
    }), 1600)
  }, [])

  const add = useCallback((files: FileList | File[] | null, autoStart: boolean, max = 20) => {
    if (!files) return
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || f.type === '').slice(0, max)
    if (!list.length) return
    update((prev) => [
      ...prev,
      ...list.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        status: (autoStart ? 'pending' : 'ready') as Status,
      })),
    ])
    if (autoStart) void run()
  }, [run])

  const start = useCallback(() => {
    update((list) => list.map((i) => (i.status === 'ready' || i.status === 'error' ? { ...i, status: 'pending' } : i)))
    void run()
  }, [run])

  const remove = useCallback((id: string) => {
    update((list) => {
      const it = list.find((i) => i.id === id)
      if (it) URL.revokeObjectURL(it.preview)
      return list.filter((i) => i.id !== id)
    })
  }, [])

  const clear = useCallback(() => {
    update((list) => {
      const keep = list.filter((i) => i.status === 'uploading' || i.status === 'pending')
      list.filter((i) => !keep.includes(i)).forEach((i) => URL.revokeObjectURL(i.preview))
      return keep
    })
  }, [])

  return { items: items.current, busy: running.current, add, start, remove, clear }
}
