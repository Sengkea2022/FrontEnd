export default defineNuxtRouteMiddleware((to, from) => {
  const authToken = useCookie('auth_token')
  
  // If token exists, redirect to home (can't access guest pages)
  if (authToken.value) {
    return navigateTo('/')
  }
})