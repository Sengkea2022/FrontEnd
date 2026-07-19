import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ProductForm {
  name: string
  sku: string
  category: string
  price: string
  stock: string
  status: string
  description: string
  store_code: string
}

export const useProductStore = defineStore('product', () => {
  const products = ref<any[]>([])
  const loading = ref(false)
  const categories = ref<any[]>([])
  const { fetch, loading: apiLoading } = useApi()

  const fetchProducts = async (storeCode?: string) => {
    loading.value = true
    try {
      const url = storeCode ? `/api/products?filter[store_code]=${storeCode}` : '/api/products'
      const res = await fetch<{ data: any[] }>(url)
      
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
        store_code: form.store_code,
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
      await fetchProducts(form.store_code)
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
        store_code: form.store_code,
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
      await fetchProducts(form.store_code)
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
      await fetchProducts(storeCode)
      ElNotification({ title: 'Success', message: 'Product deleted successfully', type: 'success' })
      return true
    } catch (e) {
      console.error('Failed to delete product:', e)
      ElNotification({ title: 'Error', message: 'Could not delete product', type: 'error' })
      return false
    }
  }

  return {
    products,
    loading,
    apiLoading,
    categories,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct
  }
})
