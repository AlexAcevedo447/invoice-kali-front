import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './app/styles/global.css'
import { AppBootstrap } from '@app/bootstrap/AppBootstrap.tsx'

// PrimeReactProvider es obligatorio: sin él, Dropdown (PrimeReact 10.9.7) lee
// context.hideOverlaysOnDocumentScrolling sobre un contexto indefinido y lanza un
// TypeError si la página se desplaza con un selector abierto. Con la configuración
// por defecto el comportamiento no cambia (el panel se realinea al desplazar).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider>
      <AppBootstrap />
    </PrimeReactProvider>
  </StrictMode>,
)
