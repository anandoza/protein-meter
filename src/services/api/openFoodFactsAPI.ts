import type {
  OpenFoodFactsApiResponse,
  OpenFoodFactsSearchResponse,
  OpenFoodFactsProduct,
} from '@/types'

export class OpenFoodFactsAPI {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org'
  private static readonly TIMEOUT_MS = 30000

  /**
   * Fetch product data by barcode
   */
  static async getProduct(barcode: string): Promise<OpenFoodFactsProduct> {
    const url = `${this.BASE_URL}/api/v2/product/${barcode}.json?fields=product_name,generic_name,nutriments`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS)

      const response = await fetch(url, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: OpenFoodFactsApiResponse = await response.json()

      if (data.status === 1 && data.product) {
        return data.product
      } else {
        throw new Error(data.status_verbose || 'Product not found')
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out')
        }
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  /**
   * Search for products by name
   */
  static async searchProducts(
    query: string,
    pageSize: number = 20
  ): Promise<OpenFoodFactsProduct[]> {
    const url = `${this.BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(
      query
    )}&search_simple=1&action=process&json=1&page_size=${pageSize}`

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS)

      const response = await fetch(url, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`)
      }

      const data: OpenFoodFactsSearchResponse = await response.json()

      return data.products || []
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Search request timed out')
        }
        throw error
      }
      throw new Error('Unknown error occurred during search')
    }
  }

  /**
   * Get the Open Food Facts URL for a product
   */
  static getProductUrl(barcode: string): string {
    return `${this.BASE_URL}/product/${barcode}`
  }

  /**
   * Extract nutrition data from product
   */
  static extractNutrition(product: OpenFoodFactsProduct): {
    protein100g: number
    energyKcal100g: number
    hasValidData: boolean
  } {
    const nutriments = product.nutriments || {}
    const protein100g = parseFloat(String(nutriments.proteins_100g || ''))
    const energyKcal100g = parseFloat(String(nutriments['energy-kcal_100g'] || ''))

    const hasValidData =
      !isNaN(protein100g) && protein100g >= 0 && !isNaN(energyKcal100g) && energyKcal100g > 0

    return {
      protein100g: isNaN(protein100g) ? 0 : protein100g,
      energyKcal100g: isNaN(energyKcal100g) ? 0 : energyKcal100g,
      hasValidData,
    }
  }

  /**
   * Extract product name with fallbacks
   */
  static extractProductName(product: OpenFoodFactsProduct): string {
    return product.product_name || product.generic_name || 'N/A'
  }

  /**
   * Extract brand name
   */
  static extractBrandName(product: OpenFoodFactsProduct): string {
    return product.brands || ''
  }
}
