import { defineEventHandler, getRequestPath, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  if (!import.meta.dev) return

  if (getRequestPath(event) === '/@vite/client') {
    return sendRedirect(event, '/_nuxt/@vite/client', 302)
  }
})
