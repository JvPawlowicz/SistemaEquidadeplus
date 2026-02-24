import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isProd = import.meta.env.PROD

function EnvGuard({ children }: { children: React.ReactNode }) {
  if (!isProd) return <>{children}</>
  if (supabaseUrl && supabaseAnonKey) return <>{children}</>
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        color: '#333',
      }}
    >
      <h1 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Configuração necessária</h1>
      <p style={{ maxWidth: '420px', marginBottom: '1rem', lineHeight: 1.6 }}>
        As variáveis de ambiente <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> não estão
        definidas no ambiente de build (ex.: Render → Environment).
      </p>
      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Adicione-as no painel do Render e faça um novo deploy.
      </p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <EnvGuard>
        <App />
      </EnvGuard>
    </ErrorBoundary>
  </StrictMode>,
)
