/** Configuración del portal. Todo lo "configurable" vive aquí. */
export const config = {
  eventName: 'Posada TI 2026',
  tagline: 'Comparte tus mejores momentos',

  /** URL del Web App de Apps Script (…/exec). Sin ella la app corre en modo demo. */
  apiUrl:
    (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined) ||
    'https://script.google.com/macros/s/AKfycbyU3CyKOkYveX24AtcVOemK1DxKoi6tIiegSGMcwHjK-BN_17YiLuqbQPL_pjHSitZN/exec',

  /** Segundos entre actualizaciones automáticas de la galería (0 = desactivado). */
  autoRefreshSeconds: 30,
  /** Permitir descargar fotos desde el visor. */
  allowDownload: true,
  /** Abrir fotos en pantalla completa al tocarlas. */
  enableLightbox: true,
  /** Lado máximo (px) al que se reduce la foto antes de subirla. */
  maxImageSize: 2000,
  /** Calidad JPEG (0-1) de la compresión. */
  imageQuality: 0.85,
  /** Máximo de fotos por selección. */
  maxFilesPerBatch: 20,
}

export const isDemo = !config.apiUrl
