import { StrictMode, Suspense, lazy, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// La pantalla de proyección se carga aparte para no pesar en el celular
const Projector = lazy(() => import('./projector/Projector'))

const isProjector = () => location.hash.startsWith('#/proyector')

function Root() {
  const [projector, setProjector] = useState(isProjector)
  useEffect(() => {
    const onHash = () => setProjector(isProjector())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return projector ? (
    <Suspense fallback={<div className="h-dvh bg-black" />}>
      <Projector />
    </Suspense>
  ) : (
    <App />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
