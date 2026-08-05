export default defineNuxtRouteMiddleware((to, from) => {
  const authToken = useCookie('auth_token')
  const authUser = useCookie<any>('auth_user')

  // Public shop menu is accessible by everyone (logged-in or unauthenticated guests)
  if (to.path.startsWith('/guest/menu')) {
    return
  }

  const isGuestRoute = to.path.startsWith('/guest/')

  // 1. Unauthenticated users: must go to login
  if (!authToken.value) {
    if (!isGuestRoute) {
      return navigateTo('/guest/login')
    }
    return
  }

  const roleSlug = authUser.value?.role?.slug
  const isDeveloper = roleSlug === 'developer'

  // Check if user is assigned to a shop (either by shop_code/store_code OR owns a shop)
  const hasShop = !!(authUser.value?.shop_code || authUser.value?.store_code) && authUser.value?.shop_code !== 'N/A' || !!authUser.value?.shop || !!authUser.value?.store

  // 2. Authenticated user visiting guest auth routes (login, register, etc.)
  if (isGuestRoute) {
    if (!hasShop && !isDeveloper) {
      return navigateTo('/join-shop')
    }
    return navigateTo('/shop')
  }

  // 3. User with NO shop: allow /join-shop and /profile, redirect everything else to /join-shop
  if (!hasShop && !isDeveloper) {
    const allowed = ['/join-shop', '/profile']
    const isAllowed = allowed.some(p => to.path === p || to.path.startsWith(p + '/'))
    if (!isAllowed) {
      return navigateTo('/join-shop')
    }
    return
  }

  // 4. Assigned staff / manager (WITH shop): allow shop operational routes & profile
  if (!isDeveloper && roleSlug === 'staff') {
    const allowedStaffRoutes = ['/shop', '/store', '/orders', '/customers', '/profile', '/guest-links']
    const isAllowed = allowedStaffRoutes.some(path => to.path === path || to.path.startsWith(path + '/'))
    if (!isAllowed) {
      const shopTarget = authUser.value?.shop?.uuid || authUser.value?.store?.uuid || authUser.value?.shop_code || authUser.value?.store_code
      const redirectPath = shopTarget ? `/shop/${shopTarget}/products` : '/shop'
      return navigateTo(redirectPath)
    }
  }
})
