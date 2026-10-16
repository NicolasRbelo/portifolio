import { defineConfig } from 'vite'

// GitHub Pages serves this project at /portifolio/ (a project page, not a user page),
// so the production build needs that prefix baked into every asset/module URL; local
// dev keeps serving from the root so `npm run dev` is unaffected.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/portifolio/' : '/',
}))
