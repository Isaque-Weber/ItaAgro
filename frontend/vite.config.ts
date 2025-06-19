import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    define: {
        // Only expose specific environment variables
        'process.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL),
    },
})
