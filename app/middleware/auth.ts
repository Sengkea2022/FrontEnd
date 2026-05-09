export default defineNuxtRouteMiddleware((to, from) => {
    const authToken = useCookie('auth_token')

    // If no token, redirect to login
    if (!authToken.value) {
       return navigateTo('/guest/login')
    }
})