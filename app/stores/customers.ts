import { defineStore } from 'pinia'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Customer {
  id: number
  customer_no: string
  name: string
  phone: string
  email: string | null
  note: string
}

export interface CustomerForm {
  name: string
  phone: string
  email: string
  note: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCustomerStore = defineStore('customers', {
  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    customers: [] as Customer[],
    loading: false,
    submitting: false,
    error: null as string | null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    totalCustomers: (state) => state.customers.length,

    getCustomerById: (state) => (id: number) =>
      state.customers.find((c) => c.id === id),
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * GET /api/v1/customers
     * Fetch all customers from the backend.
     */
    async fetchCustomers() {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.loading = true
      this.error = null

      try {
        const data = await $fetch<Customer[]>(`${baseURL}/customers`)
        this.customers = data
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to fetch customers.'
        console.error('[CustomerStore] fetchCustomers:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * POST /api/v1/customers
     * Create a new customer.
     */
    async createCustomer(form: CustomerForm): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.submitting = true
      this.error = null

      try {
        const created = await $fetch<Customer>(`${baseURL}/customers`, {
          method: 'POST',
          body: form,
        })
        this.customers.unshift(created)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to create customer.'
        console.error('[CustomerStore] createCustomer:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * PUT /api/v1/customers/:id
     * Update an existing customer.
     */
    async updateCustomer(id: number, form: CustomerForm): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.submitting = true
      this.error = null

      try {
        const updated = await $fetch<Customer>(`${baseURL}/customers/${id}`, {
          method: 'PUT',
          body: form,
        })
        const index = this.customers.findIndex((c) => c.id === id)
        if (index !== -1) this.customers[index] = updated
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to update customer.'
        console.error('[CustomerStore] updateCustomer:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * DELETE /api/v1/customers/:id
     * Delete a customer.
     */
    async deleteCustomer(id: number): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.error = null

      try {
        await $fetch(`${baseURL}/customers/${id}`, { method: 'DELETE' })
        this.customers = this.customers.filter((c) => c.id !== id)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to delete customer.'
        console.error('[CustomerStore] deleteCustomer:', err)
        return false
      }
    },

    /** Clear any stored error message. */
    clearError() {
      this.error = null
    },
  },
})
