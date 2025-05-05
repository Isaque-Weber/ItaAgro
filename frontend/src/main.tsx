// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1) BrowserRouter: habilita o roteamento no React (semelhante ao Fastify-Router) */}
    {/* 2) App: componente principal que contém as rotas e lógica do aplicativo */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
