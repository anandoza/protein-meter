import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HistoryStorage } from './historyStorage'
import type { HistoryItem } from '@/types'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

const createMockHistoryItem = (overrides: Partial<HistoryItem> = {}): HistoryItem => ({
  barcode: '1234567890',
  productName: 'Test Product',
  proteinActualPercentage: '25.0',
  proteinDisplayPercentage: '25.0',
  proteinLabel: 'Okay',
  colorClass: 'bg-yellow-500',
  fadedColorClass: 'bg-fade-yellow-500',
  proteinGrams: '10.0',
  energyKcal: '160',
  timestamp: '2023-01-01T00:00:00.000Z',
  errorMessage: null,
  isManual: false,
  ...overrides,
})

describe('HistoryStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset setItem to default mock behavior
    localStorageMock.setItem.mockImplementation(() => {})
  })

  describe('load', () => {
    it('loads empty array when no data exists', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const result = HistoryStorage.load()
      expect(result).toEqual([])
    })

    it('loads valid history data', () => {
      const mockData = [createMockHistoryItem()]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockData))

      const result = HistoryStorage.load()
      expect(result).toEqual(mockData)
    })

    it('handles invalid JSON gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      localStorageMock.getItem.mockReturnValue('invalid json')

      const result = HistoryStorage.load()
      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load history from localStorage:',
        expect.any(SyntaxError)
      )

      consoleSpy.mockRestore()
    })

    it('handles non-array data gracefully', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ not: 'array' }))

      const result = HistoryStorage.load()
      expect(result).toEqual([])
    })
  })

  describe('save', () => {
    it('saves history data to localStorage', () => {
      const mockData = [createMockHistoryItem()]
      HistoryStorage.save(mockData)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'proteinMeterHistory',
        JSON.stringify(mockData)
      )
    })

    it('handles save errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Temporarily override setItem to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      HistoryStorage.save([createMockHistoryItem()])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save history to localStorage:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
      // Reset back to normal behavior (will be done by beforeEach for next test)
    })
  })

  describe('add', () => {
    it('adds new item to empty history', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const newItem = createMockHistoryItem()

      const result = HistoryStorage.add(newItem)

      expect(result).toEqual([newItem])
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'proteinMeterHistory',
        JSON.stringify([newItem])
      )
    })

    it('adds new item to beginning of existing history', () => {
      const existingItem = createMockHistoryItem({ timestamp: '2023-01-01T00:00:00.000Z' })
      const newItem = createMockHistoryItem({
        timestamp: '2023-01-02T00:00:00.000Z',
        productName: 'Different Product', // Make it different to avoid duplicate detection
      })

      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingItem]))

      const result = HistoryStorage.add(newItem)

      expect(result).toEqual([newItem, existingItem])
    })

    it('prevents consecutive duplicates', () => {
      const existingItem = createMockHistoryItem()
      const duplicateItem = createMockHistoryItem() // Same data

      localStorageMock.getItem.mockReturnValue(JSON.stringify([existingItem]))
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = HistoryStorage.add(duplicateItem)

      expect(result).toEqual([existingItem]) // No change
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Duplicate consecutive entry prevented:',
        duplicateItem
      )

      consoleSpy.mockRestore()
    })

    it('allows non-consecutive duplicates', () => {
      const item1 = createMockHistoryItem({ timestamp: '2023-01-01T00:00:00.000Z' })
      const item2 = createMockHistoryItem({
        timestamp: '2023-01-02T00:00:00.000Z',
        productName: 'Different Product',
      })
      const item3 = createMockHistoryItem({ timestamp: '2023-01-03T00:00:00.000Z' }) // Same as item1

      localStorageMock.getItem.mockReturnValue(JSON.stringify([item2, item1]))

      const result = HistoryStorage.add(item3)

      expect(result).toEqual([item3, item2, item1])
    })
  })

  describe('remove', () => {
    it('removes item by timestamp', () => {
      const item1 = createMockHistoryItem({ timestamp: '2023-01-01T00:00:00.000Z' })
      const item2 = createMockHistoryItem({ timestamp: '2023-01-02T00:00:00.000Z' })

      localStorageMock.getItem.mockReturnValue(JSON.stringify([item2, item1]))

      const result = HistoryStorage.remove('2023-01-01T00:00:00.000Z')

      expect(result).toEqual([item2])
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'proteinMeterHistory',
        JSON.stringify([item2])
      )
    })

    it('returns unchanged array if timestamp not found', () => {
      const item1 = createMockHistoryItem({ timestamp: '2023-01-01T00:00:00.000Z' })
      localStorageMock.getItem.mockReturnValue(JSON.stringify([item1]))

      const result = HistoryStorage.remove('nonexistent-timestamp')

      expect(result).toEqual([item1])
    })
  })

  describe('clear', () => {
    it('clears all history', () => {
      HistoryStorage.clear()
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'proteinMeterHistory',
        JSON.stringify([])
      )
    })
  })

  describe('getByTimestamps', () => {
    it('returns items matching given timestamps', () => {
      const item1 = createMockHistoryItem({ timestamp: '2023-01-01T00:00:00.000Z' })
      const item2 = createMockHistoryItem({ timestamp: '2023-01-02T00:00:00.000Z' })
      const item3 = createMockHistoryItem({ timestamp: '2023-01-03T00:00:00.000Z' })

      localStorageMock.getItem.mockReturnValue(JSON.stringify([item3, item2, item1]))

      const result = HistoryStorage.getByTimestamps([
        '2023-01-01T00:00:00.000Z',
        '2023-01-03T00:00:00.000Z',
      ])

      expect(result).toEqual([item3, item1])
    })

    it('returns empty array for no matches', () => {
      const item1 = createMockHistoryItem({ timestamp: '2023-01-01T00:00:00.000Z' })
      localStorageMock.getItem.mockReturnValue(JSON.stringify([item1]))

      const result = HistoryStorage.getByTimestamps(['nonexistent'])

      expect(result).toEqual([])
    })
  })

  describe('isEmpty', () => {
    it('returns true for empty history', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))
      expect(HistoryStorage.isEmpty()).toBe(true)
    })

    it('returns false for non-empty history', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([createMockHistoryItem()]))
      expect(HistoryStorage.isEmpty()).toBe(false)
    })
  })

  describe('count', () => {
    it('returns correct count', () => {
      const items = [createMockHistoryItem(), createMockHistoryItem()]
      localStorageMock.getItem.mockReturnValue(JSON.stringify(items))

      expect(HistoryStorage.count()).toBe(2)
    })

    it('returns 0 for empty history', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]))
      expect(HistoryStorage.count()).toBe(0)
    })
  })
})
