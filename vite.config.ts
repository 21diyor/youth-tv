import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const release = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now())
export default defineConfig({
  define: { __TV_RELEASE__: JSON.stringify(release) },
  plugins: [react(), tailwindcss(), {name:"tv-release",generateBundle(){this.emitFile({type:"asset",fileName:"version.json",source:JSON.stringify({version:release})})}}],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
