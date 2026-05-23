// composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase
  
  const fetch = async (path: string, options?: any) => {
    const token = useCookie('auth_token').value
    
    const headers = {
      ...options?.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    }
    
    return $fetch(`${apiBase}${path}`, {
      method: 'GET',
      ...options,
      headers
    })
  }

  return { fetch }
}