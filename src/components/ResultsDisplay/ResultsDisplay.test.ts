import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ResultsDisplay } from './ResultsDisplay'
import type { ProductDisplayData } from '@/types'

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

  return element
}

const createMockProductData = (
  overrides: Partial<ProductDisplayData> = {}
): ProductDisplayData => ({
  productName: 'Test Product',
  proteinInfo: {
    actualPercentage: '25.0',
    displayPercentage: '25.0',
    colorClass: 'bg-yellow-500',
    fadedColorClass: 'bg-fade-yellow-500',
    label: 'Okay',
  },
  proteinGrams: '10.0',
  energyKcal: '160',
  barcode: '1234567890',
  calculationError: null,
  isManual: false,
  sourceOperation: 'scan',
  ...overrides,
})

describe('ResultsDisplay', () => {
  let resultsDisplay: ResultsDisplay
  let resultsArea: HTMLElement
  let statusMessage: HTMLElement
  let productInfo: HTMLElement
  let productName: HTMLElement
  let proteinBar: HTMLElement
  let proteinLabel: HTMLElement
  let proteinGrams: HTMLElement
  let energyKcal: HTMLElement
  let barcodeResult: HTMLElement
  let barcodeRow: HTMLElement
  let offLink: HTMLAnchorElement
  let errorMessage: HTMLElement

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock DOM elements
    resultsArea = createMockElement('results-area')
    statusMessage = createMockElement('status-message')
    productInfo = createMockElement('product-info')
    productName = createMockElement('product-name')
    proteinBar = createMockElement('protein-bar')
    proteinLabel = createMockElement('protein-label')
    proteinGrams = createMockElement('protein-grams')
    energyKcal = createMockElement('energy-kcal')
    barcodeResult = createMockElement('barcode-result')
    barcodeRow = createMockElement('barcode-row')
    offLink = createMockElement('off-link', 'a') as HTMLAnchorElement
    errorMessage = createMockElement('error-message')

    // Add style property to proteinBar
    Object.defineProperty(proteinBar, 'style', {
      value: { width: '0%' },
      writable: true,
    })

    // Add elements to DOM
    document.body.appendChild(resultsArea)
    document.body.appendChild(statusMessage)
    document.body.appendChild(productInfo)
    document.body.appendChild(productName)
    document.body.appendChild(proteinBar)
    document.body.appendChild(proteinLabel)
    document.body.appendChild(proteinGrams)
    document.body.appendChild(energyKcal)
    document.body.appendChild(barcodeResult)
    document.body.appendChild(barcodeRow)
    document.body.appendChild(offLink)
    document.body.appendChild(errorMessage)

    // Mock getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      switch (id) {
        case 'results-area':
          return resultsArea
        case 'status-message':
          return statusMessage
        case 'product-info':
          return productInfo
        case 'product-name':
          return productName
        case 'protein-bar':
          return proteinBar
        case 'protein-label':
          return proteinLabel
        case 'protein-grams':
          return proteinGrams
        case 'energy-kcal':
          return energyKcal
        case 'barcode-result':
          return barcodeResult
        case 'barcode-row':
          return barcodeRow
        case 'off-link':
          return offLink
        case 'error-message':
          return errorMessage
        default:
          return null
      }
    })

    // Mock querySelectorAll for unit labels
    vi.spyOn(document, 'querySelectorAll').mockReturnValue([
      { textContent: '/ 100g' },
      { textContent: '/ 100g' },
    ] as any)

    resultsDisplay = new ResultsDisplay(
      'results-area',
      'status-message',
      'product-info',
      'product-name',
      'protein-bar',
      'protein-label',
      'protein-grams',
      'energy-kcal',
      'barcode-result',
      'barcode-row',
      'off-link',
      'error-message',
      '.unit-label'
    )
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('initializes with DOM elements', () => {
      expect(document.getElementById).toHaveBeenCalledWith('results-area')
      expect(document.getElementById).toHaveBeenCalledWith('status-message')
      // ... other elements
    })

    it('throws error for missing elements', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      expect(() => {
        new ResultsDisplay(
          'missing',
          'status-message',
          'product-info',
          'product-name',
          'protein-bar',
          'protein-label',
          'protein-grams',
          'energy-kcal',
          'barcode-result',
          'barcode-row',
          'off-link',
          'error-message',
          '.unit-label'
        )
      }).toThrow('Element with id "missing" not found')
    })

    it('shows idle state initially', () => {
      expect(statusMessage.textContent).toBe('Click "Scan Barcode" or "Manual Entry".')
      expect((productInfo.classList as any).add).toHaveBeenCalledWith('hidden')
    })
  })

  describe('updateDisplay', () => {
    it('updates all product information', () => {
      const data = createMockProductData()

      resultsDisplay.updateDisplay(data)

      expect(productName.textContent).toBe('Test Product')
      expect(proteinGrams.textContent).toBe('10.0')
      expect(energyKcal.textContent).toBe('160')
      expect(proteinBar.style.width).toBe('25.0%')
      expect(proteinBar.textContent).toBe('25.0%')
      expect(proteinLabel.textContent).toBe('Okay')
      expect(barcodeResult.textContent).toBe('1234567890')
      expect(offLink.href).toBe('https://world.openfoodfacts.org/product/1234567890')
    })

    it('handles manual entry data', () => {
      const data = createMockProductData({
        isManual: true,
        barcode: null,
      })

      resultsDisplay.updateDisplay(data)

      expect((barcodeRow.classList as any).add).toHaveBeenCalledWith('hidden')
      expect((offLink.classList as any).add).toHaveBeenCalledWith('hidden')
      // Unit labels should be updated to "/ serving" for manual entries
    })

    it('handles calculation errors', () => {
      const data = createMockProductData({
        calculationError: 'Missing protein data',
      })

      resultsDisplay.updateDisplay(data)

      expect(errorMessage.textContent).toBe('Missing protein data')
      expect(statusMessage.textContent).toContain('calculation incomplete')
    })

    it('handles N/A values', () => {
      const data = createMockProductData({
        proteinGrams: 'N/A',
        energyKcal: 'N/A',
      })

      resultsDisplay.updateDisplay(data)

      expect(proteinGrams.textContent).toBe('N/A')
      expect(energyKcal.textContent).toBe('N/A')
    })

    it('shows results area and product info', () => {
      const data = createMockProductData()

      resultsDisplay.updateDisplay(data)

      expect((resultsArea.classList as any).remove).toHaveBeenCalledWith('hidden')
      expect((productInfo.classList as any).remove).toHaveBeenCalledWith('hidden')
    })
  })

  describe('state methods', () => {
    it('updates status message', () => {
      resultsDisplay.updateStatus('Custom status message')
      expect(statusMessage.textContent).toBe('Custom status message')
    })

    it('shows error state', () => {
      resultsDisplay.showError('Network error')

      expect(errorMessage.textContent).toBe('Network error')
      expect(statusMessage.textContent).toBe('Error occurred.')
      expect((resultsArea.classList as any).remove).toHaveBeenCalledWith('hidden')
    })

    it('shows idle state', () => {
      resultsDisplay.showIdleState()

      expect(statusMessage.textContent).toBe('Click "Scan Barcode" or "Manual Entry".')
      expect((productInfo.classList as any).add).toHaveBeenCalledWith('hidden')
      expect(errorMessage.textContent).toBe('')
    })

    it('shows scanning state', () => {
      resultsDisplay.showScanningState()

      expect(statusMessage.textContent).toBe('Starting scanner...')
      expect((productInfo.classList as any).add).toHaveBeenCalledWith('hidden')
    })

    it('shows manual entry state', () => {
      resultsDisplay.showManualEntryState()

      expect(statusMessage.textContent).toBe('Enter product details manually.')
      expect((productInfo.classList as any).add).toHaveBeenCalledWith('hidden')
    })

    it('shows search state', () => {
      resultsDisplay.showSearchState()

      expect(statusMessage.textContent).toBe('Enter a food name to search.')
      expect((productInfo.classList as any).add).toHaveBeenCalledWith('hidden')
    })
  })

  describe('visibility methods', () => {
    it('shows results area', () => {
      resultsDisplay.show()

      expect((resultsArea.classList as any).remove).toHaveBeenCalledWith('hidden')
      expect((productInfo.classList as any).remove).toHaveBeenCalledWith('hidden')
    })

    it('hides results area', () => {
      resultsDisplay.hide()

      expect((resultsArea.classList as any).add).toHaveBeenCalledWith('hidden')
    })

    it('returns visibility state', () => {
      ;(resultsArea.classList as any).contains.mockReturnValue(true)
      expect(resultsDisplay.isVisible()).toBe(false)
      ;(resultsArea.classList as any).contains.mockReturnValue(false)
      expect(resultsDisplay.isVisible()).toBe(true)
    })
  })

  describe('clear', () => {
    it('resets all display elements', () => {
      resultsDisplay.clear()

      expect(productName.textContent).toBe('')
      expect(proteinGrams.textContent).toBe('N/A')
      expect(energyKcal.textContent).toBe('N/A')
      expect(proteinBar.style.width).toBe('0%')
      expect(proteinBar.textContent).toBe('0%')
      expect(proteinLabel.textContent).toBe('N/A')
      expect(barcodeResult.textContent).toBe('')
      expect(errorMessage.textContent).toBe('')
      expect((productInfo.classList as any).add).toHaveBeenCalledWith('hidden')
    })
  })
})
