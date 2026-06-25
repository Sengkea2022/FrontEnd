// composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  /**
   * Wrapper around $fetch that automatically injects the Bearer token.
   *
   * @param path    - API path relative to apiBase  e.g. '/api/stores'
   * @param options - Any $fetch options:
   *                  method  → 'GET' | 'POST' | 'PUT' | 'DELETE'
   *                  body    → request body (POST / PUT)
   *                  query   → URL query params  e.g. { page: 1, search: 'foo' }
   */
  const fetch = async <T = any>(path: string, options?: any): Promise<T> => {
    const token = useCookie('auth_token').value

    const headers = {
      ...options?.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    }

    return $fetch<T>(`${apiBase}${path}`, {
      method: 'GET',
      ...options,
      headers,
    })
  }

  return { fetch }
}