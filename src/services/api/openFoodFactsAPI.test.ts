import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OpenFoodFactsAPI } from './openFoodFactsAPI'
import type { OpenFoodFactsApiResponse, OpenFoodFactsSearchResponse } from '@/types'

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock setTimeout/clearTimeout for timeout tests
const mockSetTimeout = vi.fn()
const mockClearTimeout = vi.fn()
vi.stubGlobal('setTimeout', mockSetTimeout)
vi.stubGlobal('clearTimeout', mockClearTimeout)

describe('OpenFoodFactsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSetTimeout.mockImplementation((_fn) => {
      // Return a mock timer ID
      return 123
    })
  })

  describe('getProduct', () => {
    it('fetches product successfully', async () => {
      const mockProduct = {
        code: '1234567890',
        product_name: 'Test Product',
        nutriments: {
          proteins_100g: 25,
          'energy-kcal_100g': 200,
        },
      }

      const mockResponse: OpenFoodFactsApiResponse = {
        status: 1,
        product: mockProduct,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await OpenFoodFactsAPI.getProduct('1234567890')

      expect(result).toEqual(mockProduct)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://world.openfoodfacts.org/api/v2/product/1234567890.json?fields=product_name,generic_name,nutriments',
        expect.objectContaining({
          signal: expect.objectContaining({
            aborted: expect.any(Boolean),
          }),
        })
      )
    })

    it('handles product not found', async () => {
      const mockResponse: OpenFoodFactsApiResponse = {
        status: 0,
        status_verbose: 'Product not found in database',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await expect(OpenFoodFactsAPI.getProduct('9999999999')).rejects.toThrow(
        'Product not found in database'
      )
    })

    it('handles HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await expect(OpenFoodFactsAPI.getProduct('1234567890')).rejects.toThrow(
        'HTTP error! status: 500'
      )
    })

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(OpenFoodFactsAPI.getProduct('1234567890')).rejects.toThrow('Network error')
    })

    it('handles timeout', async () => {
      const mockAbortController = {
        signal: { aborted: false },
        abort: vi.fn(),
      }
      vi.stubGlobal(
        'AbortController',
        vi.fn(() => mockAbortController)
      )

      mockFetch.mockRejectedValueOnce(
        Object.assign(new Error('AbortError'), { name: 'AbortError' })
      )

      await expect(OpenFoodFactsAPI.getProduct('1234567890')).rejects.toThrow('Request timed out')
    })
  })

  describe('searchProducts', () => {
    it('searches products successfully', async () => {
      const mockProducts = [
        {
          code: '1234567890',
          product_name_en: 'Test Product 1',
          brands: 'Test Brand',
        },
        {
          code: '0987654321',
          product_name: 'Test Product 2',
        },
      ]

      const mockResponse: OpenFoodFactsSearchResponse = {
        products: mockProducts,
        count: 2,
        page_count: 1,
        page_size: 20,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await OpenFoodFactsAPI.searchProducts('test')

      expect(result).toEqual(mockProducts)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://world.openfoodfacts.org/cgi/search.pl?search_terms=test&search_simple=1&action=process&json=1&page_size=20',
        expect.objectContaining({
          signal: expect.objectContaining({
            aborted: expect.any(Boolean),
          }),
        })
      )
    })

    it('handles empty search results', async () => {
      const mockResponse: OpenFoodFactsSearchResponse = {
        products: [],
        count: 0,
        page_count: 0,
        page_size: 20,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await OpenFoodFactsAPI.searchProducts('nonexistent')

      expect(result).toEqual([])
    })

    it('handles search API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      })

      await expect(OpenFoodFactsAPI.searchProducts('test')).rejects.toThrow(
        'Network response was not ok: Internal Server Error'
      )
    })

    it('uses custom page size', async () => {
      const mockResponse: OpenFoodFactsSearchResponse = {
        products: [],
        count: 0,
        page_count: 0,
        page_size: 50,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await OpenFoodFactsAPI.searchProducts('test', 50)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page_size=50'),
        expect.any(Object)
      )
    })
  })

  describe('getProductUrl', () => {
    it('generates correct product URL', () => {
      const url = OpenFoodFactsAPI.getProductUrl('1234567890')
      expect(url).toBe('https://world.openfoodfacts.org/product/1234567890')
    })
  })

  describe('extractNutrition', () => {
    it('extracts valid nutrition data', () => {
      const product = {
        code: '1234567890',
        nutriments: {
          proteins_100g: 25.5,
          'energy-kcal_100g': 200,
        },
      }

      const result = OpenFoodFactsAPI.extractNutrition(product)

      expect(result).toMatchInlineSnapshot(`
        {
          "energyKcal100g": 200,
          "hasValidData": true,
          "protein100g": 25.5,
        }
      `)
    })

    it('handles missing nutrition data', () => {
      const product = {
        code: '1234567890',
        nutriments: {},
      }

      const result = OpenFoodFactsAPI.extractNutrition(product)

      expect(result).toMatchInlineSnapshot(`
        {
          "energyKcal100g": 0,
          "hasValidData": false,
          "protein100g": 0,
        }
      `)
    })

    it('handles invalid nutrition data', () => {
      const product = {
        code: '1234567890',
        nutriments: {
          proteins_100g: NaN,
          'energy-kcal_100g': -100,
        },
      }

      const result = OpenFoodFactsAPI.extractNutrition(product)

      expect(result).toMatchInlineSnapshot(`
        {
          "energyKcal100g": -100,
          "hasValidData": false,
          "protein100g": 0,
        }
      `)
    })

    it('handles missing nutriments object', () => {
      const product = {
        code: '1234567890',
      }

      const result = OpenFoodFactsAPI.extractNutrition(product)

      expect(result).toMatchInlineSnapshot(`
        {
          "energyKcal100g": 0,
          "hasValidData": false,
          "protein100g": 0,
        }
      `)
    })
  })

  describe('extractProductName', () => {
    it('uses product_name when available', () => {
      const product = {
        code: '1234567890',
        product_name: 'Primary Name',
        generic_name: 'Generic Name',
      }

      expect(OpenFoodFactsAPI.extractProductName(product)).toBe('Primary Name')
    })

    it('falls back to generic_name', () => {
      const product = {
        code: '1234567890',
        generic_name: 'Generic Name',
      }

      expect(OpenFoodFactsAPI.extractProductName(product)).toBe('Generic Name')
    })

    it('falls back to N/A when no names available', () => {
      const product = {
        code: '1234567890',
      }

      expect(OpenFoodFactsAPI.extractProductName(product)).toBe('N/A')
    })
  })

  describe('extractBrandName', () => {
    it('extracts brand name when available', () => {
      const product = {
        code: '1234567890',
        brands: 'Test Brand, Another Brand',
      }

      expect(OpenFoodFactsAPI.extractBrandName(product)).toBe('Test Brand, Another Brand')
    })

    it('returns empty string when no brands', () => {
      const product = {
        code: '1234567890',
      }

      expect(OpenFoodFactsAPI.extractBrandName(product)).toBe('')
    })
  })
})
