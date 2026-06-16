import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// allowing tailwindcss configs
export default defineConfig
( {
  plugins: [ react(), tailwindcss() ],
} )
