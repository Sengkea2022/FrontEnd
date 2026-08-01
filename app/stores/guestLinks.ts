import { defineStore } from 'pinia'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GuestLinkStoreRelation {
  id?: number
  uuid?: string
  code: string
  name: string
}

export interface GuestLink {
  id: number
  uuid: string
  code: string
  store_code: string
  store?: GuestLinkStoreRelation | string
  token: string
  label?: string
  qr_path?: string
  expires_at?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface GuestLinkForm {
  store_code: string
  token: string
  label?: string
  expires_at?: string | null
  is_active?: boolean
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGuestLinkStore = defineStore('guestLinks', {
  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    guestLinks: [] as GuestLink[],
    loading: false,
    submitting: false,
    error: null as string | null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    totalLinks: (state) => state.guestLinks.length,

    activeLinks: (state) =>
      state.guestLinks.filter((link) => link.is_active),

    inactiveLinks: (state) =>
      state.guestLinks.filter((link) => !link.is_active),

    getLinkById: (state) => (id: number) =>
      state.guestLinks.find((link) => link.id === id),

    getLinkByUuid: (state) => (uuid: string) =>
      state.guestLinks.find((link) => link.uuid === uuid),
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * GET /api/guest-links
     * Fetch guest links from the backend.
     */
    async fetchGuestLinks(storeCode?: string) {
      const { fetch } = useApi()
      this.loading = true
      this.error = null

      try {
        const url = storeCode ? `/api/guest-links?filter[store_code]=${storeCode}` : '/api/guest-links'
        const response = await fetch<any>(url)
        this.guestLinks = response.data ?? (Array.isArray(response) ? response : [])
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to fetch guest links.'
        console.error('[GuestLinkStore] fetchGuestLinks:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * POST /api/guest-links
     * Create a new guest link.
     */
    async createGuestLink(form: GuestLinkForm): Promise<boolean> {
      const { fetch } = useApi()
      this.submitting = true
      this.error = null

      try {
        const res = await fetch<any>('/api/guest-links', {
          method: 'POST',
          body: form,
        })
        const created = res.data ?? res
        this.guestLinks.unshift(created)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to create guest link.'
        console.error('[GuestLinkStore] createGuestLink:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * PUT /api/guest-links/:uuid
     * Update an existing guest link.
     */
    async updateGuestLink(uuid: string, form: Partial<GuestLinkForm>): Promise<boolean> {
      const { fetch } = useApi()
      this.submitting = true
      this.error = null

      try {
        const res = await fetch<any>(`/api/guest-links/${uuid}`, {
          method: 'PUT',
          body: form,
        })
        const updated = res.data ?? res
        const index = this.guestLinks.findIndex((link) => link.uuid === uuid)
        if (index !== -1) this.guestLinks[index] = updated
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to update guest link.'
        console.error('[GuestLinkStore] updateGuestLink:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * DELETE /api/guest-links/:uuid
     * Delete a guest link.
     */
    async deleteGuestLink(uuid: string): Promise<boolean> {
      const { fetch } = useApi()
      this.error = null

      try {
        await fetch(`/api/guest-links/${uuid}`, { method: 'DELETE' })
        this.guestLinks = this.guestLinks.filter((link) => link.uuid !== uuid)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to delete guest link.'
        console.error('[GuestLinkStore] deleteGuestLink:', err)
        return false
      }
    },

    /** Clear any stored error message. */
    clearError() {
      this.error = null
    },
  },
})
