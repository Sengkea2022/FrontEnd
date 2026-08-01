import { defineStore } from 'pinia'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled' | 'returned'

export interface OrderStoreRelation {
  id?: number
  uuid?: string
  code: string
  name: string
}

export interface OrderCustomerRelation {
  id?: number
  uuid?: string
  code: string
  name: string
  phone?: string
  email?: string
}

export interface OrderCurrencyRelation {
  id?: number
  uuid?: string
  code: string
  name?: string
  symbol?: string
}

export interface Order {
  id: number
  uuid: string
  code: string
  store_code: string
  store?: OrderStoreRelation | string
  customer_code: string
  customer?: OrderCustomerRelation | string
  currency_code: string
  currency?: OrderCurrencyRelation | string
  status: OrderStatus
  note?: string
  reason?: string
  created_at: string
  updated_at?: string
}

export interface OrderForm {
  store_code: string
  customer_code: string
  currency_code: string
  status: OrderStatus
  note?: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOrderStore = defineStore('orders', {
  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    orders: [] as Order[],
    loading: false,
    submitting: false,
    error: null as string | null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    totalOrders: (state) => state.orders.length,

    pendingOrders: (state) =>
      state.orders.filter((o) => o.status === 'pending'),

    completedOrders: (state) =>
      state.orders.filter((o) => o.status === 'completed'),

    getOrderById: (state) => (id: number) =>
      state.orders.find((o) => o.id === id),

    getOrderByUuid: (state) => (uuid: string) =>
      state.orders.find((o) => o.uuid === uuid),
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * GET /api/orders
     * Fetch orders from the backend with optional store filter.
     */
    async fetchOrders(storeCode?: string) {
      const { fetch } = useApi()
      this.loading = true
      this.error = null

      try {
        const url = storeCode ? `/api/orders?filter[store_code]=${storeCode}` : '/api/orders'
        const response = await fetch<any>(url)
        this.orders = response.data ?? (Array.isArray(response) ? response : [])
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to fetch orders.'
        console.error('[OrderStore] fetchOrders:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * POST /api/orders
     * Create a new order.
     */
    async createOrder(form: OrderForm): Promise<boolean> {
      const { fetch } = useApi()
      this.submitting = true
      this.error = null

      try {
        const res = await fetch<any>('/api/orders', {
          method: 'POST',
          body: form,
        })
        const created = res.data ?? res
        this.orders.unshift(created)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to create order.'
        console.error('[OrderStore] createOrder:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * PUT /api/orders/:uuid
     * Update an existing order.
     */
    async updateOrder(uuid: string, form: Partial<OrderForm>): Promise<boolean> {
      const { fetch } = useApi()
      this.submitting = true
      this.error = null

      try {
        const res = await fetch<any>(`/api/orders/${uuid}`, {
          method: 'PUT',
          body: form,
        })
        const updated = res.data ?? res
        const index = this.orders.findIndex((o) => o.uuid === uuid)
        if (index !== -1) this.orders[index] = updated
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to update order.'
        console.error('[OrderStore] updateOrder:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * DELETE /api/orders/:uuid
     * Delete an order.
     */
    async deleteOrder(uuid: string): Promise<boolean> {
      const { fetch } = useApi()
      this.error = null

      try {
        await fetch(`/api/orders/${uuid}`, { method: 'DELETE' })
        this.orders = this.orders.filter((o) => o.uuid !== uuid)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to delete order.'
        console.error('[OrderStore] deleteOrder:', err)
        return false
      }
    },

    /** Clear any stored error message. */
    clearError() {
      this.error = null
    },
  },
})
