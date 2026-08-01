import { defineStore } from 'pinia'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShopStatus = 'Active' | 'Inactive' | 'Maintenance'
export type ShopType   = 'Retail' | 'Booking' | 'Service'

export interface Shop {
  uuid:        string
  code?:       string
  user_code?:  string
  name:        string
  owner?:      { name?: string; email?: string; code?: string }
  country?:    string
  state?:      string
  city?:       string
  commune?:    string
  village?:    string
  type:        ShopType
  manager_id?: number | null
  status:      ShopStatus
  address?:    string
  staff_ids?:  number[]
  theme_color?: string
}

export interface ShopForm {
  name:        string
  user_code?:  string
  country:     string
  state:       string
  city:        string
  commune:     string
  village:     string
  type:        ShopType | ''
  manager_id:  number | null
  status:      ShopStatus
  address:     string
  staff_ids:   number[]
  theme_color?: string
}

export interface ShopParams {
  filter?:   string
  search?:   string
  paginate?: {
    page?:     number   // default 1 on frontend
    pageSize?: number   // no default — Laravel handles it
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useShopStore = defineStore('shop', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    shops:      [] as Shop[],
    loading:    false,
    submitting: false,
    error:      null as string | null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    totalShops:  (state) => state.shops.length,
    activeShops: (state) => state.shops.filter((s) => s.status === 'Active'),

    /** Ready-made options for <el-select> dropdowns */
    shopOptions: (state) => state.shops.map((s) => ({ label: s.name, value: s.name })),

    getShopByUuid: (state) => (uuid: string) =>
      state.shops.find((s) => s.uuid === uuid),
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * GET /api/stores
     *
     * Usage:
     *   fetchShops()                                        → all, page 1
     *   fetchShops({ search: 'Central' })                   → search
     *   fetchShops({ filter: 'Active' })                    → filter by status
     *   fetchShops({ paginate: { page: 2, pageSize: 10 } }) → paginated
     */
    async fetchShops({ filter, search, paginate }: ShopParams = {}) {
      const { fetch } = useApi()
      this.loading = true
      this.error   = null
      try {
        const response = await fetch<any>('/api/stores', {
          query: {
            filter,
            search,
            page:     paginate?.page ?? 1,
            pageSize: paginate?.pageSize,
          },
        })
        this.shops = response.data ?? response
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to fetch stores.'
        console.error('[ShopStore] fetchShops:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * POST /api/stores
     */
    async createShop(form: ShopForm): Promise<boolean> {
      const { fetch } = useApi()
      this.submitting = true
      this.error      = null
      try {
        const response = await fetch<any>('/api/stores', {
          method: 'POST',
          body:   form,
        })
        const created = response.data ?? response
        this.shops.unshift(created)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to create store.'
        console.error('[ShopStore] createShop:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * PUT /api/stores/:uuid
     */
    async updateShop(uuid: string, form: ShopForm): Promise<boolean> {
      const { fetch } = useApi()
      this.submitting = true
      this.error      = null
      try {
        const response = await fetch<any>(`/api/stores/${uuid}`, {
          method: 'PUT',
          body:   form,
        })
        const updated = response.data ?? response
        const index = this.shops.findIndex((s) => s.uuid === uuid)
        if (index !== -1) this.shops[index] = updated
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to update store.'
        console.error('[ShopStore] updateShop:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * DELETE /api/stores/:uuid
     */
    async deleteShop(uuid: string): Promise<boolean> {
      const { fetch } = useApi()
      this.error = null
      try {
        await fetch(`/api/stores/${uuid}`, { method: 'DELETE' })
        this.shops = this.shops.filter((s) => s.uuid !== uuid)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to delete store.'
        console.error('[ShopStore] deleteShop:', err)
        return false
      }
    },

    /** Clear any stored error message */
    clearError() {
      this.error = null
    },
  },
})
