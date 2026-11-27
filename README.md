# Posada TI 2026 · Portal de fotos

React + Vite + TypeScript + Tailwind. Sube fotos (cámara o galería) a Google Drive y consúltalas en una galería.

## Desarrollo
```bash
npm install
cp .env.example .env   # pega aquí la URL del Web App (…/exec)
npm run dev
```
Sin `VITE_APPS_SCRIPT_URL` la app corre en **modo demo** (no guarda en Drive).

## Backend (Apps Script)
`apps-script/Code.gs` expone `GET ?action=list` y `POST` de subida sobre la carpeta de Drive.
Implementar como Web App → ejecutar como *Yo*, acceso *Cualquier usuario*. Si ya tienes tu script, solo debe respetar el mismo contrato.

## Configuración
Ajustes en `src/config.ts` (auto‑actualización, descarga, lightbox, calidad de imagen, etc.).

## GitHub Pages
1. Settings → Pages → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → *Variables*: `VITE_APPS_SCRIPT_URL`.
3. Push a `main`. URL: https://jevalrepo.github.io/posadati/
