import { defineStore } from 'pinia'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductStatus = 'Published' | 'Draft' | 'Hidden'
export type ProductCategory = 'Product' | 'Service' | 'Booking'

export interface Product {
  id: number
  name: string
  sku: string
  category: ProductCategory
  price: string
  stock: string
  store: string
  status: ProductStatus
  description?: string
}

export interface ProductForm {
  name: string
  sku: string
  category: ProductCategory | ''
  price: string
  stock: string
  store: string
  status: ProductStatus
  description: string
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProductStore = defineStore('products', {
  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    products: [] as Product[],
    loading: false,
    submitting: false,
    error: null as string | null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    totalProducts: (state) => state.products.length,

    publishedProducts: (state) =>
      state.products.filter((p) => p.status === 'Published'),

    bookingItems: (state) =>
      state.products.filter((p) => p.category === 'Booking'),

    getProductById: (state) => (id: number) =>
      state.products.find((p) => p.id === id),
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * GET /api/v1/products
     * Fetch all products from the backend.
     */
    async fetchProducts() {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.loading = true
      this.error = null

      try {
        const data = await $fetch<Product[]>(`${baseURL}/products`)
        this.products = data
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to fetch products.'
        console.error('[ProductStore] fetchProducts:', err)
      } finally {
        this.loading = false
      }
    },

    /**
     * POST /api/v1/products
     * Create a new product.
     */
    async createProduct(form: ProductForm): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.submitting = true
      this.error = null

      try {
        const created = await $fetch<Product>(`${baseURL}/products`, {
          method: 'POST',
          body: form,
        })
        this.products.unshift(created)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to create product.'
        console.error('[ProductStore] createProduct:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * PUT /api/v1/products/:id
     * Update an existing product.
     */
    async updateProduct(id: number, form: ProductForm): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.submitting = true
      this.error = null

      try {
        const updated = await $fetch<Product>(`${baseURL}/products/${id}`, {
          method: 'PUT',
          body: form,
        })
        const index = this.products.findIndex((p) => p.id === id)
        if (index !== -1) this.products[index] = updated
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to update product.'
        console.error('[ProductStore] updateProduct:', err)
        return false
      } finally {
        this.submitting = false
      }
    },

    /**
     * DELETE /api/v1/products/:id
     * Delete a product.
     */
    async deleteProduct(id: number): Promise<boolean> {
      const config = useRuntimeConfig()
      const baseURL = `${config.public.apiBase}/api/v${config.public.apiVersion}`

      this.error = null

      try {
        await $fetch(`${baseURL}/products/${id}`, { method: 'DELETE' })
        this.products = this.products.filter((p) => p.id !== id)
        return true
      } catch (err: any) {
        this.error = err?.data?.message ?? 'Failed to delete product.'
        console.error('[ProductStore] deleteProduct:', err)
        return false
      }
    },

    /** Clear any stored error message. */
    clearError() {
      this.error = null
    },
  },
})
