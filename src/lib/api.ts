import { config, isDemo } from '../config'
import { blobToDataUrl, compressImage } from './image'
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
    demoStore.push({ id: `demo-${i}`, name: `demo-${i}.jpg`, src: demoSvg(i, h) }),
  )
}

export const thumbUrl = (p: Photo, w = 600) => p.src ?? `https://drive.google.com/thumbnail?id=${p.id}&sz=w${w}`
export const fullUrl = (p: Photo) => p.src ?? `https://drive.google.com/thumbnail?id=${p.id}&sz=w2000`
export const sizedUrl = (p: Photo, w: number) => p.src ?? `https://drive.google.com/thumbnail?id=${p.id}&sz=w${w}`
export const downloadUrl = (p: Photo) => p.src ?? `https://drive.google.com/uc?export=download&id=${p.id}`

async function parseJson(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    const title = text.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim()
    throw new Error(
      `El servidor no respondió JSON (HTTP ${res.status}${title ? ` · "${title}"` : ''}). ` +
        'Revisa que el Web App esté implementado con acceso "Cualquier usuario" (no "con cuenta de Google").',
    )
  }
}

export async function listPhotos(): Promise<Photo[]> {
  if (isDemo) return [...demoStore]
  const res = await fetch(config.apiUrl)
  const data = await parseJson(res)
  if (!data.success) throw new Error(data.error ?? 'No se pudo cargar la galería')
  // El script no entrega fecha: los nombres llevan timestamp, así que ordenamos por nombre (más recientes primero)
  return (data.files as Photo[]).sort((a, b) => b.name.localeCompare(a.name))
}

export async function uploadPhoto(file: File): Promise<void> {
  const blob = await compressImage(file)
  if (isDemo) {
    await new Promise((r) => setTimeout(r, 900))
    demoStore.unshift({ id: `local-${Date.now()}`, name: file.name, src: URL.createObjectURL(blob) })
    return
  }
  const dataUrl = await blobToDataUrl(blob)
  const type = blob.type || 'image/jpeg'
  const ext = type === 'image/jpeg' ? 'jpg' : type.split('/')[1] || 'jpg'
  const name = `${Date.now()}-${Math.floor(Math.random() * 1e4)}.${ext}`
  // text/plain evita el preflight CORS que Apps Script no soporta
  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ files: [{ name, type, dataUrl }] }),
  })
  const json = await parseJson(res)
  if (!json.success) throw new Error(json.error ?? 'Error al subir la foto')
}
