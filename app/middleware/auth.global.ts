export default defineNuxtRouteMiddleware((to, from) => {
  const authToken = useCookie('auth_token')
  const authUser = useCookie<any>('auth_user')

  const isGuestRoute = to.path.startsWith('/guest/')

  // 1. Unauthenticated users: must go to login
  if (!authToken.value) {
    if (!isGuestRoute) {
      return navigateTo('/guest/login')
    }
    return
  }

  const roleSlug = authUser.value?.role?.slug
  const isSuperAdmin = ['superadmin', 'admin'].includes(roleSlug)

  // Check if user is assigned to a store (either by store_code OR owns a store)
  const hasStore = !!(authUser.value?.store_code && authUser.value.store_code !== 'N/A' && authUser.value.store_code !== '') || !!authUser.value?.store

  // 2. Authenticated user visiting guest routes
  if (isGuestRoute) {
    if (!isSuperAdmin && !hasStore) {
      return navigateTo('/join-store')
    }
    return navigateTo('/store')
  }

  // 3. User with NO store_code and NO store: LOCK strictly to join-store and profile ONLY!
  if (!isSuperAdmin && !hasStore) {
    const allowedUnassigned = ['/join-store', '/profile']
    const isAllowed = allowedUnassigned.some(path => to.path === path || to.path.startsWith(path + '/'))
    if (!isAllowed) {
      return navigateTo('/join-store')
    }
    return
  }

  // 4. Assigned staff / manager (WITH store): allow store operational routes & profile
  if (!isSuperAdmin && roleSlug === 'staff') {
    const allowedStaffRoutes = ['/store', '/orders', '/customers', '/profile', '/guest-links']
    const isAllowed = allowedStaffRoutes.some(path => to.path === path || to.path.startsWith(path + '/'))
    if (!isAllowed) {
      const storeTarget = authUser.value?.store?.uuid || authUser.value?.store_code
      const redirectPath = storeTarget ? `/store/${storeTarget}/products` : '/store'
      return navigateTo(redirectPath)
    }
  }
})
