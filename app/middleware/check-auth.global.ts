export default defineNuxtRouteMiddleware(async (to, from) => {
  const authToken = useCookie('auth_token')
  const authUser = useCookie('auth_user')

  // Public store menu is accessible by everyone (logged-in or unauthenticated guests)
  if (to.path.startsWith('/guest/menu')) {
    if (authToken.value && !authUser.value) {
      try {
        const { fetch } = useApi()
        const { user }: any = await fetch('/api/user')
        authUser.value = user
      } catch (e) {
        // ignore fetch error for public pages
      }
    }
    return
  }

  const guestRoutes = ['/guest/login', '/guest/register', '/guest/forgot-password', '/guest/verify-otp']
  const isGuestRoute = guestRoutes.includes(to.path)

  if (!authToken.value && !isGuestRoute) {
    return navigateTo('/guest/login')
  }

  if (authToken.value && isGuestRoute) {
    return navigateTo('/dashboard')
  }

  if (authToken.value && !authUser.value) {
    try {
      const { fetch } = useApi()
      const { user }: any = await fetch('/api/user')
      authUser.value = user
    } catch (e) {
      console.error(e)
    }
  }
})
