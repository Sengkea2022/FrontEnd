export default defineNuxtRouteMiddleware((to) => {
  const authToken = useCookie('auth_token')

  const guestRoutes = ['/guest/login', '/guest/register']
  const isGuestRoute = guestRoutes.includes(to.path)

  if (!authToken.value && !isGuestRoute) {
    return navigateTo('/guest/login')
  }

  if (authToken.value && isGuestRoute) {
    return navigateTo('/')
  }
})
