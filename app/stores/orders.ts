import { defineStore } from 'pinia'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'

export interface Order {
  id: number
  order_no: string
  store: string
  customer: string
  currency: string
  status: OrderStatus
  note: string
  created_at: string
}

export interface OrderForm {
  store: string
  customer: string
  currency: string
  status: OrderStatus
  note: string
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
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * GET /api/v1/orders
     * Fetch all orders from the backend.
     */
    async fetchOrders() {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.loading = true
      this.error = null

      try {
        const data = await $fetch<Order[]>(`${baseURL}/orders`)
        this.orders = data
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to fetch orders.'
        console.error('[OrderStore] fetchOrders:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * POST /api/v1/orders
     * Create a new order.
     */
    async createOrder(form: OrderForm): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.submitting = true
      this.error = null

      try {
        const created = await $fetch<Order>(`${baseURL}/orders`, {
          method: 'POST',
          body: form,
        })
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
     * PUT /api/v1/orders/:id
     * Update an existing order.
     */
    async updateOrder(id: number, form: OrderForm): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.submitting = true
      this.error = null

      try {
        const updated = await $fetch<Order>(`${baseURL}/orders/${id}`, {
          method: 'PUT',
          body: form,
        })
        const index = this.orders.findIndex((o) => o.id === id)
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
     * DELETE /api/v1/orders/:id
     * Delete an order.
     */
    async deleteOrder(id: number): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.error = null

      try {
        await $fetch(`${baseURL}/orders/${id}`, { method: 'DELETE' })
        this.orders = this.orders.filter((o) => o.id !== id)
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
