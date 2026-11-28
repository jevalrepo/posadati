import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRemoteSettings, saveRemoteSettings } from '../lib/api'

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

const KEY = 'posada-proyector-ajustes-locales'
/** Ajustes guardados en el repo (public/proyector-ajustes.json): son la base para cualquier computadora. */
const REPO_URL = `${import.meta.env.BASE_URL}proyector-ajustes.json`

/** Acepta solo claves conocidas con el mismo tipo que el valor por defecto. */
function sanitize(raw: unknown): Partial<Settings> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Partial<Settings> = {}
  for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
    const v = (raw as Record<string, unknown>)[k]
    if (typeof v === typeof DEFAULTS[k]) (out as Record<string, unknown>)[k] = v
  }
  return out
}

function readLocal(): Partial<Settings> {
  try {
    // Migra los ajustes guardados por la versión anterior
    const legacy = localStorage.getItem('posada-proyector-ajustes')
    if (legacy && !localStorage.getItem(KEY)) localStorage.setItem(KEY, legacy)
    localStorage.removeItem('posada-proyector-ajustes')
    return sanitize(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return {}
  }
}

export type SyncMode = 'remote' | 'local'

const POLL_MS = 15000

/**
 * Prioridad: valores por defecto < archivo del repo < ajustes compartidos (Apps Script) < cambios locales.
 * Si el Apps Script soporta ajustes, los cambios se guardan ahí y todas las pantallas los reciben.
 * Si no, se guardan solo en esta computadora (localStorage).
 */
export function useSettings() {
  const [repo, setRepo] = useState<Partial<Settings>>({})
  const [remote, setRemote] = useState<Partial<Settings> | null>(null)
  const [local, setLocal] = useState<Partial<Settings>>(readLocal)
  const [saving, setSaving] = useState(false)
  const pending = useRef<Partial<Settings> | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const mode: SyncMode = remote ? 'remote' : 'local'

  useEffect(() => {
    fetch(`${REPO_URL}?v=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setRepo(sanitize(j)))
      .catch(() => { /* sin archivo: se usan los valores por defecto */ })
  }, [])

  // Ajustes compartidos: se consultan al inicio y periódicamente
  useEffect(() => {
    let alive = true
    const load = async () => {
      if (pending.current) return // no pisar cambios que aún se están guardando
      const r = await getRemoteSettings()
      if (alive) setRemote(r ? sanitize(r) : null)
    }
    void load()
    const id = setInterval(load, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [])

  // Con ajustes compartidos activos, los cambios locales viejos se suben una vez y se limpian
  useEffect(() => {
    if (mode === 'remote' && Object.keys(local).length) {
      const merged = { ...remote, ...local }
      setRemote(merged)
      setLocal({})
      void saveRemoteSettings(merged)
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      if (Object.keys(local).length) localStorage.setItem(KEY, JSON.stringify(local))
      else localStorage.removeItem(KEY)
    } catch { /* sin almacenamiento */ }
  }, [local])

  const base = useMemo(() => ({ ...DEFAULTS, ...repo }), [repo])
  const settings = useMemo<Settings>(() => ({ ...base, ...(remote ?? {}), ...local }), [base, remote, local])
  const hasLocalChanges = (Object.keys(local) as (keyof Settings)[]).some((k) => local[k] !== base[k])

  const pushRemote = useCallback((next: Partial<Settings>) => {
    pending.current = next
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSaving(true)
      await saveRemoteSettings(pending.current ?? {})
      pending.current = null
      setSaving(false)
    }, 600)
  }, [])

  const update = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => {
    if (remote) {
      setRemote((r) => {
        const next = { ...(r ?? {}), [k]: v }
        pushRemote(next)
        return next
      })
    } else {
      setLocal((l) => ({ ...l, [k]: v }))
    }
  }, [remote, pushRemote])

  const reset = useCallback(() => {
    setLocal({})
    if (remote) { setRemote({}); pushRemote({}) }
  }, [remote, pushRemote])

  const exportJson = useCallback(() => JSON.stringify(settings, null, 2), [settings])

  return { settings, update, reset, hasLocalChanges, exportJson, mode, saving, isCustom: mode === 'remote' ? !!remote && Object.keys(remote).length > 0 : hasLocalChanges }
}
