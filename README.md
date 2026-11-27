# Posada TI 2026 · Portal de fotos

React + Vite + TypeScript + Tailwind. Sube fotos (cámara o galería) a Google Drive y consúltalas en una galería.

## Desarrollo
```bash
npm install
cp .env.example .env   # pega aquí la URL del Web App (…/exec)
npm run dev
```
Para ver el diseño sin tocar Drive: `VITE_DEMO=1 npm run dev` (modo demo con fotos de ejemplo).

## Backend (Apps Script)
`apps-script/Code.gs` expone `GET` (lista) y `POST` (subida, `{files:[{name,type,dataUrl}]}`) sobre la carpeta de Drive.
Implementar como Web App → ejecutar como *Yo*, acceso *Cualquier usuario*. Si ya tienes tu script, solo debe respetar el mismo contrato.

## Configuración
Ajustes en `src/config.ts` (auto‑actualización, descarga, lightbox, calidad de imagen, etc.).

## GitHub Pages
1. Settings → Pages → Source: **GitHub Actions**.
2. La URL del Web App está en `src/config.ts` (`DEFAULT_API_URL`).
3. Push a `main`. URL: https://jevalrepo.github.io/posadati/
