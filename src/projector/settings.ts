import { useEffect, useState } from 'react'

export type Transition = 'fade' | 'slide' | 'zoom' | 'blur' | 'flip' | 'rise'
export type TransitionChoice = Transition | 'random'
export type Order = 'recent' | 'oldest' | 'random'
export type Fit = 'contain' | 'cover'
export type ColorFx = 'none' | 'bw' | 'sepia' | 'warm' | 'vivid'

export interface Settings {
  transition: TransitionChoice
  kenBurns: boolean
  interval: number // segundos por foto
  speed: number // ms de transición
  order: Order
  fit: Fit
  colorFx: ColorFx
  showQr: boolean
  showInfo: boolean
  prioritizeNew: boolean
}

export const DEFAULTS: Settings = {
  transition: 'fade',
  kenBurns: true,
  interval: 7,
  speed: 1200,
  order: 'recent',
  fit: 'contain',
  colorFx: 'none',
  showQr: true,
  showInfo: true,
  prioritizeNew: true,
}

export const TRANSITIONS: { id: TransitionChoice; label: string }[] = [
  { id: 'fade', label: 'Desvanecer' },
  { id: 'slide', label: 'Deslizar' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'blur', label: 'Desenfoque' },
  { id: 'flip', label: 'Giro 3D' },
  { id: 'rise', label: 'Elevar' },
  { id: 'random', label: 'Aleatoria' },
]
export const ORDERS: { id: Order; label: string }[] = [
  { id: 'recent', label: 'Más recientes' },
  { id: 'oldest', label: 'Más antiguas' },
  { id: 'random', label: 'Aleatorio' },
]
export const FITS: { id: Fit; label: string }[] = [
  { id: 'contain', label: 'Foto completa' },
  { id: 'cover', label: 'Llenar pantalla' },
]
export const COLOR_FX: { id: ColorFx; label: string; css: string }[] = [
  { id: 'none', label: 'Natural', css: 'none' },
  { id: 'bw', label: 'Blanco y negro', css: 'grayscale(1) contrast(1.08)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(.65) contrast(1.05)' },
  { id: 'warm', label: 'Cálido', css: 'sepia(.22) saturate(1.3) hue-rotate(-8deg)' },
  { id: 'vivid', label: 'Vívido', css: 'saturate(1.55) contrast(1.1)' },
]

const KEY = 'posada-proyector-ajustes'

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
    } catch {
      return DEFAULTS
    }
  })
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* sin almacenamiento */ }
  }, [settings])
  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v }))
  const reset = () => setSettings(DEFAULTS)
  return { settings, update, reset }
}
