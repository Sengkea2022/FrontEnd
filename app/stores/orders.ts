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
  shop_code?: string
  store_code?: string
  shop?: OrderStoreRelation | string
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
  shop_code?: string
  store_code?: string
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
    totalOrdersCount: 0,
    pendingOrdersCount: 0,
    completedOrdersCount: 0,
    currentPage: 1,
    perPage: 10,
    loading: false,
    submitting: false,
    error: null as string | null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    totalOrders: (state) => state.totalOrdersCount || state.orders.length,

    pendingCount: (state) => state.pendingOrdersCount,

    completedCount: (state) => state.completedOrdersCount,

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
     * Fetch orders from the backend with optional shop filter and pagination.
     */
    async fetchOrders(storeCode?: string, page = 1, perPage = 10) {
      const { fetch } = useApi()
      this.loading = true
      this.error = null
      this.currentPage = page
      this.perPage = perPage

      try {
        let url = `/api/orders?page=${page}&per_page=${perPage}`
        if (storeCode) {
          url += `&shop_uuid=${encodeURIComponent(storeCode)}`
        }
        const response = await fetch<any>(url)
        if (response?.meta) {
          this.orders = response.data ?? []
          this.totalOrdersCount = response.meta.total ?? response.data.length
          this.pendingOrdersCount = response.meta.pending_count ?? this.orders.filter(o => o.status === 'pending').length
          this.completedOrdersCount = response.meta.completed_count ?? this.orders.filter(o => o.status === 'completed').length
          this.currentPage = response.meta.current_page ?? page
          this.perPage = response.meta.per_page ?? perPage
        } else {
          this.orders = response.data ?? (Array.isArray(response) ? response : [])
          this.totalOrdersCount = this.orders.length
          this.pendingOrdersCount = this.orders.filter(o => o.status === 'pending').length
          this.completedOrdersCount = this.orders.filter(o => o.status === 'completed').length
        }
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
        this.totalOrdersCount++
        if (created.status === 'pending') this.pendingOrdersCount++
        if (created.status === 'completed') this.completedOrdersCount++
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
        if (index !== -1) {
          const oldStatus = this.orders[index].status
          const newStatus = updated.status
          if (oldStatus !== newStatus) {
            if (oldStatus === 'pending') this.pendingOrdersCount = Math.max(0, this.pendingOrdersCount - 1)
            if (oldStatus === 'completed') this.completedOrdersCount = Math.max(0, this.completedOrdersCount - 1)
            if (newStatus === 'pending') this.pendingOrdersCount++
            if (newStatus === 'completed') this.completedOrdersCount++
          }
          this.orders[index] = updated
        }
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
        const target = this.orders.find(o => o.uuid === uuid)
        if (target) {
          if (target.status === 'pending') this.pendingOrdersCount = Math.max(0, this.pendingOrdersCount - 1)
          if (target.status === 'completed') this.completedOrdersCount = Math.max(0, this.completedOrdersCount - 1)
        }
        this.orders = this.orders.filter((o) => o.uuid !== uuid)
        this.totalOrdersCount = Math.max(0, this.totalOrdersCount - 1)
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
