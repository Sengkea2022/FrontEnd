export default defineNuxtRouteMiddleware((to, from) => {
  const authToken = useCookie('auth_token')
  
  // Define which routes are protected (need auth)
  const protectedRoutes = ['/', '/profile', '/dashboard', '/settings']
  
  // Define which routes are public (guest only)
  const guestRoutes = ['/guest/login', '/guest/register']
  
  // If accessing protected route without token
  if (protectedRoutes.includes(to.path) && !authToken.value) {
    return navigateTo('/guest/login')
  }
  
  // If accessing guest route with token
  if (guestRoutes.includes(to.path) && authToken.value) {
    return navigateTo('/')
  }
})