import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AdminPage from './pages/AdminPage.jsx'
import QuotePage from './pages/QuotePage.jsx'
import './styles.css'
import './pages/pages.css'
import './pages/quote.css'
import './pages/admin-light.css'

function Router() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === '/admin') return <AdminPage />
  if (path === '/orcamento') return <QuotePage />
  return <App />
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><Router /></React.StrictMode>
)
