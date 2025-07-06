import type { HistoryItem } from '@/types'

export class HistoryStorage {
  private static readonly STORAGE_KEY = 'proteinMeterHistory'

  /**
   * Load history from localStorage
   */
  static load(): HistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('Failed to load history from localStorage:', error)
      return []
    }
  }

  /**
   * Save history to localStorage
   */
  static save(history: HistoryItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save history to localStorage:', error)
    }
  }

  /**
   * Add item to history (prevents consecutive duplicates)
   */
  static add(item: HistoryItem): HistoryItem[] {
    const history = this.load()

    // Check for consecutive duplicate
    if (history.length > 0) {
      const mostRecent = history[0]
      if (this.isConsecutiveDuplicate(item, mostRecent)) {
        console.log('Duplicate consecutive entry prevented:', item)
        return history
      }
    }

    // Add to beginning of array (most recent first)
    const newHistory = [item, ...history]
    this.save(newHistory)
    return newHistory
  }

  /**
   * Remove item from history by timestamp
   */
  static remove(timestamp: string): HistoryItem[] {
    const history = this.load()
    const filtered = history.filter((item) => item.timestamp !== timestamp)
    this.save(filtered)
    return filtered
  }

  /**
   * Clear all history
   */
  static clear(): void {
    this.save([])
  }

  /**
   * Check if two items are consecutive duplicates
   */
  private static isConsecutiveDuplicate(item1: HistoryItem, item2: HistoryItem): boolean {
    return (
      item1.barcode === item2.barcode &&
      item1.productName === item2.productName &&
      item1.proteinGrams === item2.proteinGrams &&
      item1.energyKcal === item2.energyKcal &&
      item1.isManual === item2.isManual &&
      item1.proteinActualPercentage === item2.proteinActualPercentage
    )
  }

  /**
   * Get items that match the given timestamps
   */
  static getByTimestamps(timestamps: string[]): HistoryItem[] {
    const history = this.load()
    const timestampSet = new Set(timestamps)
    return history.filter((item) => timestampSet.has(item.timestamp))
  }

  /**
   * Check if history is empty
   */
  static isEmpty(): boolean {
    return this.load().length === 0
  }

  /**
   * Get count of items in history
   */
  static count(): number {
    return this.load().length
  }
}
