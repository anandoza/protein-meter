/**
 * Custom event system for component communication
 */

// Event names
export const EVENTS = {
  BARCODE_SCANNED: 'barcode-scanned',
  SCAN_ERROR: 'scan-error',
  MANUAL_ENTRY_SUBMIT: 'manual-entry-submit',
  SEARCH_SUBMIT: 'search-submit',
  PRODUCT_RESULT: 'product-result',
  UI_MODE_CHANGE: 'ui-mode-change',
  HISTORY_UPDATED: 'history-updated',
  HISTORY_MODE_CHANGE: 'history-mode-change',
  HISTORY_DELETE: 'history-delete',
  HISTORY_CLEAR_ALL: 'history-clear-all',
  COMPARISON_SELECTION_CHANGE: 'comparison-selection-change',
} as const

// Re-export event interfaces from types
export type {
  BarcodeScannedEvent,
  ManualEntrySubmitEvent,
  UIModeChangeEvent,
  HistoryModeChangeEvent,
  HistoryDeleteEvent,
  ComparisonSelectionChangeEvent,
} from '@/types'

// Event data interfaces
export interface ScanErrorEvent {
  error: string
  barcode?: string
}

export interface SearchSubmitEvent {
  query: string
}

import type { ProductDisplayData } from '@/types'

export interface ProductResultEvent {
  data: ProductDisplayData
  sourceOperation: string
}

/**
 * Type-safe event emitter
 */
export class EventBus {
  private static instance: EventBus
  private target = new EventTarget()

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  emit<T>(eventName: string, data: T): void {
    this.target.dispatchEvent(
      new CustomEvent(eventName, {
        detail: data,
      })
    )
  }

  on<T>(eventName: string, handler: (event: CustomEvent<T>) => void): () => void {
    this.target.addEventListener(eventName, handler as EventListener)

    // Return cleanup function
    return () => {
      this.target.removeEventListener(eventName, handler as EventListener)
    }
  }

  off(eventName: string, handler: EventListener): void {
    this.target.removeEventListener(eventName, handler)
  }
}
