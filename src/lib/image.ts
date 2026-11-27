import { config } from '../config'

/** Reduce y comprime la foto en el dispositivo para subir rápido. */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Solo se permiten imágenes')
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, config.maxImageSize / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', config.imageQuality))
    if (blob && blob.size < file.size) return blob
    return file
  } catch {
    return file // formatos que el navegador no decodifica: se sube tal cual
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}
