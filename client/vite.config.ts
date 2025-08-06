import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // This will let us call our backend API without CORS issues
      '/api': {
        target: 'http://localhost:8080', // Assuming your backend runs on port 5001
        changeOrigin: true,
      },
    },
  },
})