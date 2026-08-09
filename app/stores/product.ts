import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElNotification } from 'element-plus'

export interface ProductForm {
  name: string
  sku: string
  category: string
  price: string
  stock: string
  status: string
  description: string
  shop_code: string
  store_code?: string
}

export const useProductStore = defineStore('product', () => {
  const products = ref<any[]>([])
  const loading = ref(false)
  const categories = ref<any[]>([])
  const currentPage = ref(1)
  const perPage = ref(10)
  const totalProducts = ref(0)
  const lastPage = ref(1)
  const searchKey = ref('')

  const { fetch, loading: apiLoading } = useApi()

  const fetchProducts = async (storeCode?: string, page: number = 1, limit: number = 10, search: string = '', categoryCode: string = '') => {
    loading.value = true
    currentPage.value = page
    perPage.value = limit
    searchKey.value = search
    try {
      let url = `/api/products?paginate=true&page=${page}&per_page=${limit}`
      if (storeCode) {
        url += `&filter[shop_code]=${storeCode}`
      }
      if (categoryCode) {
        url += `&filter[category_code]=${encodeURIComponent(categoryCode)}`
      }
      if (search) {
        url += `&search[product_name]=${encodeURIComponent(search)}`
      }
      
      const res = await fetch<{ data: any[]; meta?: any }>(url)
      
      // Map backend structure to frontend structure
      products.value = (res.data || []).map(p => ({
        uuid: p.uuid,
        code: p.code,
        name: p.product_name,
        sku: p.code, // using code as sku
        category: p.category?.name || p.category_code,
        category_code: p.category_code,
        price: p.prices?.[0]?.retail_unit_price || '0.00',
        stock: p.stocks?.[0]?.qty || '0',
        status: p.is_active ? 'Published' : 'Draft',
        description: p.description
      }))

      if (res.meta) {
        currentPage.value = res.meta.current_page ?? page
        perPage.value = res.meta.per_page ?? limit
        totalProducts.value = res.meta.total ?? products.value.length
        lastPage.value = res.meta.last_page ?? 1
      } else {
        totalProducts.value = products.value.length
        lastPage.value = 1
      }
    } catch (e) {
      console.error('Failed to fetch products:', e)
      ElNotification({ title: 'Error', message: 'Could not load products', type: 'error' })
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async (searchQuery: string = '') => {
    try {
      const url = searchQuery 
        ? `/api/categories?search=${encodeURIComponent(searchQuery)}&paginate=true&per_page=10`
        : `/api/categories?paginate=true&per_page=10`
      const res = await fetch<{ data: any[] }>(url)
      categories.value = res.data || []
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  }

  const createProduct = async (form: ProductForm) => {
    try {
      // Map frontend flat structure to backend payload
      const payload = {
        shop_code: form.shop_code || form.store_code,
        store_code: form.shop_code || form.store_code,
        category_code: form.category,
        product_name: form.name,
        description: form.description,
        is_active: form.status === 'Published',
        price: form.price,
        stock: form.stock
      }
      
      const res = await fetch<{ data: any }>('/api/products', {
        method: 'POST',
        body: payload,
      })
      await fetchProducts(form.shop_code || form.store_code, currentPage.value, perPage.value, searchKey.value)
      ElNotification({ title: 'Success', message: 'Product created successfully', type: 'success' })
      return true
    } catch (e) {
      console.error('Failed to create product:', e)
      ElNotification({ title: 'Error', message: 'Could not create product', type: 'error' })
      return false
    }
  }

  const updateProduct = async (uuid: string, form: ProductForm) => {
    try {
      const payload = {
        shop_code: form.shop_code || form.store_code,
        store_code: form.shop_code || form.store_code,
        category_code: form.category,
        product_name: form.name,
        description: form.description,
        is_active: form.status === 'Published',
        price: form.price,
        stock: form.stock
      }
      
      await fetch<{ data: any }>(`/api/products/${uuid}`, {
        method: 'PUT',
        body: payload,
      })
      await fetchProducts(form.shop_code || form.store_code, currentPage.value, perPage.value, searchKey.value)
      ElNotification({ title: 'Success', message: 'Product updated successfully', type: 'success' })
      return true
    } catch (e) {
      console.error('Failed to update product:', e)
      ElNotification({ title: 'Error', message: 'Could not update product', type: 'error' })
      return false
    }
  }

  const deleteProduct = async (uuid: string, storeCode?: string) => {
    try {
      await fetch(`/api/products/${uuid}`, {
        method: 'DELETE',
      })
      await fetchProducts(storeCode, currentPage.value, perPage.value, searchKey.value)
      ElNotification({ title: 'Success', message: 'Product deleted successfully', type: 'success' })
      return true
    } catch (e) {
      console.error('Failed to delete product:', e)
      ElNotification({ title: 'Error', message: 'Could not delete product', type: 'error' })
      return false
    }
  }

  const createCategory = async (name: string) => {
    try {
      const trimmed = name.trim()
      if (!trimmed) return null

      // Check existing category locally (case-insensitive) first to avoid duplicate API calls
      const existing = categories.value.find(
        c => c.name?.toLowerCase() === trimmed.toLowerCase() || c.code?.toLowerCase() === trimmed.toLowerCase()
      )
      if (existing) {
        return existing
      }

      const res = await fetch<{ data: any }>('/api/categories', {
        method: 'POST',
        body: { name: trimmed }
      })
      if (res && res.data) {
        await fetchCategories()
        return res.data
      }
    } catch (e: any) {
      console.error('Failed to create category:', e)
      await fetchCategories()
      const existing = categories.value.find(
        c => c.name?.toLowerCase() === name.trim().toLowerCase()
      )
      if (existing) return existing
      ElNotification({ title: 'Error', message: e?.data?.message || 'Could not create category', type: 'error' })
      return null
    }
  }

  return {
    products,
    loading,
    apiLoading,
    categories,
    currentPage,
    perPage,
    totalProducts,
    lastPage,
    searchKey,
    fetchProducts,
    fetchCategories,
    createCategory,
    createProduct,
    updateProduct,
    deleteProduct
  }
})
