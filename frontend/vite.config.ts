import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,      // escuta em todas as interfaces (0.0.0.0)
        port: 5173,
        strictPort: true,
        // Aqui você permite o host do ngrok — ou use 'all' para aceitar qualquer um:
        allowedHosts: [
            'a4a2-189-12-152-104.ngrok-free.app',
            // 'all'
        ],
        // Se estiver usando HMR via WebSocket, pode precisar:
        hmr: {
            protocol: 'wss',
            host: 'a4a2-189-12-152-104.ngrok-free.app'
        }
    }
})
