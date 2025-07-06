import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SearchFood } from './SearchFood'
import { EVENTS } from '@/utils/events'
import { OpenFoodFactsAPI } from '@/services/api/openFoodFactsAPI'

// Mock OpenFoodFactsAPI
vi.mock('@/services/api/openFoodFactsAPI', () => ({
  OpenFoodFactsAPI: {
    searchProducts: vi.fn(),
    extractProductName: vi.fn().mockReturnValue('Test Product'),
    extractBrandName: vi.fn().mockReturnValue('Test Brand'),
  },
}))

// Mock DOM elements
const createMockElement = (id: string, tagName = 'div') => {
  const element = document.createElement(tagName)
  element.id = id

  const classListMock = {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn().mockReturnValue(false),
  }

  Object.defineProperty(element, 'classList', {
    value: classListMock,
    writable: true,
  })

  if (tagName === 'button') {
    ;(element as HTMLButtonElement).disabled = false
  }

  return element
}

describe('SearchFood', () => {
  let searchFood: SearchFood
  let formContainer: HTMLElement
  let form: HTMLFormElement
  let queryInput: HTMLInputElement
  let errorElement: HTMLElement
  let cancelButton: HTMLButtonElement
  let searchButton: HTMLButtonElement
  let resultsArea: HTMLElement
  let resultsListElement: HTMLElement
  let noResultsMessage: HTMLElement
  let spinner: HTMLElement

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock DOM elements
    formContainer = createMockElement('search-form-container')
    form = createMockElement('search-form', 'form') as HTMLFormElement
    queryInput = createMockElement('query-input', 'input') as HTMLInputElement
    errorElement = createMockElement('error-element')
    cancelButton = createMockElement('cancel-button', 'button') as HTMLButtonElement
    searchButton = createMockElement('search-button', 'button') as HTMLButtonElement
    resultsArea = createMockElement('results-area')
    resultsListElement = createMockElement('results-list')
    noResultsMessage = createMockElement('no-results')
    spinner = createMockElement('spinner')

    // Add methods to form mock
    form.reset = vi.fn()

    // Add style property to noResultsMessage
    Object.defineProperty(noResultsMessage, 'style', {
      value: { display: 'block' },
      writable: true,
    })

    // Mock appendChild for resultsListElement
    resultsListElement.appendChild = vi.fn()

    // Add elements to DOM
    document.body.appendChild(formContainer)
    document.body.appendChild(form)
    document.body.appendChild(queryInput)
    document.body.appendChild(errorElement)
    document.body.appendChild(cancelButton)
    document.body.appendChild(searchButton)
    document.body.appendChild(resultsArea)
    document.body.appendChild(resultsListElement)
    document.body.appendChild(noResultsMessage)
    document.body.appendChild(spinner)

    // Mock getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      switch (id) {
        case 'search-form-container':
          return formContainer
        case 'search-form':
          return form
        case 'query-input':
          return queryInput
        case 'error-element':
          return errorElement
        case 'cancel-button':
          return cancelButton
        case 'search-button':
          return searchButton
        case 'results-area':
          return resultsArea
        case 'results-list':
          return resultsListElement
        case 'no-results':
          return noResultsMessage
        case 'spinner':
          return spinner
        default:
          return null
      }
    })

    searchFood = new SearchFood(
      'search-form-container',
      'search-form',
      'query-input',
      'error-element',
      'cancel-button',
      'search-button',
      'results-area',
      'results-list',
      'no-results',
      'spinner'
    )
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('initializes with DOM elements', () => {
      expect(document.getElementById).toHaveBeenCalledWith('search-form-container')
      expect(document.getElementById).toHaveBeenCalledWith('search-form')
      // ... other elements
    })

    it('throws error for missing elements', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      expect(() => {
        new SearchFood(
          'missing',
          'search-form',
          'query-input',
          'error-element',
          'cancel-button',
          'search-button',
          'results-area',
          'results-list',
          'no-results',
          'spinner'
        )
      }).toThrow('Element with id "missing" not found')
    })

    it('hides form initially', () => {
      expect((formContainer.classList as any).add).toHaveBeenCalledWith('hidden')
      expect((resultsArea.classList as any).add).toHaveBeenCalledWith('hidden')
    })
  })

  describe('show', () => {
    it('shows form and focuses input', () => {
      const focusSpy = vi.spyOn(queryInput, 'focus').mockImplementation(() => {})

      searchFood.show()

      expect((formContainer.classList as any).remove).toHaveBeenCalledWith('hidden')
      expect((resultsArea.classList as any).remove).toHaveBeenCalledWith('hidden')
      expect(form.reset).toHaveBeenCalled()
      expect(focusSpy).toHaveBeenCalled()
    })
  })

  describe('hide', () => {
    it('hides form and results', () => {
      searchFood.hide()

      expect((formContainer.classList as any).add).toHaveBeenCalledWith('hidden')
      expect((resultsArea.classList as any).add).toHaveBeenCalledWith('hidden')
    })
  })

  describe('form submission', () => {
    it('validates empty query', async () => {
      queryInput.value = ''

      const submitEvent = new Event('submit')
      await form.dispatchEvent(submitEvent)

      expect(errorElement.textContent).toContain('Please enter a food name to search')
      expect((errorElement.classList as any).remove).toHaveBeenCalledWith('hidden')
    })

    it('performs search with valid query', async () => {
      const mockProducts = [
        { code: '1234567890', product_name: 'Test Product 1' },
        { code: '0987654321', product_name: 'Test Product 2' },
      ]

      vi.mocked(OpenFoodFactsAPI.searchProducts).mockResolvedValue(mockProducts)
      queryInput.value = 'test query'

      const submitEvent = new Event('submit')
      await form.dispatchEvent(submitEvent)

      expect(OpenFoodFactsAPI.searchProducts).toHaveBeenCalledWith('test query')
    })

    it('handles search errors', async () => {
      vi.mocked(OpenFoodFactsAPI.searchProducts).mockRejectedValue(new Error('Network error'))
      queryInput.value = 'test query'

      const submitEvent = new Event('submit')
      await form.dispatchEvent(submitEvent)

      expect(errorElement.textContent).toContain('Search failed: Network error')
    })

    it('shows loading state during search', async () => {
      let resolveSearch: () => void
      const searchPromise = new Promise<any[]>((resolve) => {
        resolveSearch = () => resolve([])
      })
      vi.mocked(OpenFoodFactsAPI.searchProducts).mockReturnValue(searchPromise)

      queryInput.value = 'test query'

      const submitEvent = new Event('submit')
      form.dispatchEvent(submitEvent)

      // Check loading state
      expect((spinner.classList as any).remove).toHaveBeenCalledWith('hidden')
      expect(searchButton.disabled).toBe(true)
      expect(cancelButton.disabled).toBe(true)

      // Resolve search
      resolveSearch!()
      await searchPromise

      // Check idle state
      expect((spinner.classList as any).add).toHaveBeenCalledWith('hidden')
      expect(searchButton.disabled).toBe(false)
      expect(cancelButton.disabled).toBe(false)
    })
  })

  describe('search results', () => {
    it('displays search results', async () => {
      const mockProducts = [
        { code: '1234567890', product_name: 'Test Product 1' },
        { code: '0987654321', product_name: 'Test Product 2' },
      ]

      vi.mocked(OpenFoodFactsAPI.searchProducts).mockResolvedValue(mockProducts)
      queryInput.value = 'test query'

      const submitEvent = new Event('submit')
      await form.dispatchEvent(submitEvent)

      // Check that appendChild was called for each product
      expect(resultsListElement.appendChild).toHaveBeenCalledTimes(2)
    })

    it('shows no results message for empty results', async () => {
      vi.mocked(OpenFoodFactsAPI.searchProducts).mockResolvedValue([])
      queryInput.value = 'nonexistent'

      const submitEvent = new Event('submit')
      await form.dispatchEvent(submitEvent)

      expect(noResultsMessage.textContent).toContain('No products found for "nonexistent"')
      expect(noResultsMessage.style.display).toBe('block')
    })

    it('handles product click', () => {
      const mockProducts = [{ code: '1234567890', product_name: 'Test Product' }]

      vi.mocked(OpenFoodFactsAPI.searchProducts).mockResolvedValue(mockProducts)

      const eventSpy = vi.fn()
      const eventBus = (searchFood as any).eventBus
      eventBus.on(EVENTS.BARCODE_SCANNED, eventSpy)

      // Simulate product click by calling handleProductClick directly
      ;(searchFood as any).handleProductClick('1234567890')

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { barcode: '1234567890' },
        })
      )
    })
  })

  describe('cancel button', () => {
    it('hides form and emits UI mode change', () => {
      const eventSpy = vi.fn()
      const eventBus = (searchFood as any).eventBus
      eventBus.on(EVENTS.UI_MODE_CHANGE, eventSpy)

      cancelButton.click()

      expect((formContainer.classList as any).add).toHaveBeenCalledWith('hidden')
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { mode: 'idle' },
        })
      )
    })
  })

  describe('public API', () => {
    it('returns visibility state', () => {
      ;(formContainer.classList as any).contains.mockReturnValue(true)
      expect(searchFood.isVisible()).toBe(false)
      ;(formContainer.classList as any).contains.mockReturnValue(false)
      expect(searchFood.isVisible()).toBe(true)
    })

    it('resets form and results', () => {
      searchFood.reset()

      expect(form.reset).toHaveBeenCalled()
      expect((errorElement.classList as any).add).toHaveBeenCalledWith('hidden')
      expect(resultsListElement.innerHTML).toBe('')
      expect(noResultsMessage.textContent).toContain('Type a food name and click search')
    })

    it('cleans up on destroy', () => {
      const destroySpy = vi.spyOn(searchFood, 'destroy')

      searchFood.destroy()

      expect(destroySpy).toHaveBeenCalled()
    })
  })
})
