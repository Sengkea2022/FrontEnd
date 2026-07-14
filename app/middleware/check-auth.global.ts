export default defineNuxtRouteMiddleware(async (to, from) => {
  const authToken = useCookie('auth_token')
  const authUser = useCookie('auth_user')

  const guestRoutes = ['/guest/login', '/guest/register', '/guest/forgot-password', '/guest/verify-otp']
  const isGuestRoute = guestRoutes.includes(to.path)

  if (!authToken.value && !isGuestRoute) {
    return navigateTo('/guest/login')
  }

  if (authToken.value && isGuestRoute) {
    return navigateTo('/dashboard')
  }

  if (authToken.value && !authUser.value) {
        const { fetch } = useApi()
        const { user }: any = await fetch('/api/user')
        authUser.value = user
    }
})
