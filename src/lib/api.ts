import { config, isDemo } from '../config'
import { blobToBase64, compressImage } from './image'
import type { Photo } from './types'

/** Demo: fotos generadas localmente para ver el diseño sin backend. */
const demoStore: Photo[] = []
const palette = ['#EB0029', '#323E48', '#FF671B', '#6CC24A', '#FFA400', '#5B6670']
function demoSvg(i: number, h: number) {
  const c = palette[i % palette.length]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='${h}'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c}'/><stop offset='1' stop-color='#323E48'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='50%' fill='white' fill-opacity='.8' font-family='sans-serif' font-size='28' text-anchor='middle'>Foto demo ${i + 1}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
if (isDemo) {
  const heights = [400, 560, 480, 640, 420, 520, 600, 460]
  heights.forEach((h, i) =>
    demoStore.push({ id: `demo-${i}`, name: `demo-${i}.jpg`, createdAt: new Date(Date.now() - i * 3600e3).toISOString(), src: demoSvg(i, h) }),
  )
}

export const thumbUrl = (p: Photo, w = 600) => p.src ?? `https://drive.google.com/thumbnail?id=${p.id}&sz=w${w}`
export const fullUrl = (p: Photo) => p.src ?? `https://drive.google.com/thumbnail?id=${p.id}&sz=w2000`
export const downloadUrl = (p: Photo) => p.src ?? `https://drive.google.com/uc?export=download&id=${p.id}`

export async function listPhotos(): Promise<Photo[]> {
  if (isDemo) return [...demoStore]
  const res = await fetch(`${config.apiUrl}?action=list`)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error ?? 'No se pudo cargar la galería')
  return data.files as Photo[]
}

export async function uploadPhoto(file: File): Promise<void> {
  const blob = await compressImage(file)
  if (isDemo) {
    await new Promise((r) => setTimeout(r, 900))
    demoStore.unshift({ id: `local-${Date.now()}`, name: file.name, createdAt: new Date().toISOString(), src: URL.createObjectURL(blob) })
    return
  }
  const data = await blobToBase64(blob)
  // text/plain evita el preflight CORS que Apps Script no soporta
  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ name: file.name, mimeType: blob.type || 'image/jpeg', data }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error ?? 'Error al subir la foto')
}
