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
  COMPARISON_SELECTION_CHANGE: 'comparison-selection-change',
} as const

// Event data interfaces
export interface BarcodeScannedEvent {
  barcode: string
}

export interface ScanErrorEvent {
  error: string
  barcode?: string
}

export interface ManualEntrySubmitEvent {
  name: string
  calories: number
  protein: number
}

export interface SearchSubmitEvent {
  query: string
}

export interface ProductResultEvent {
  data: any // ProductDisplayData
  sourceOperation: string
}

export interface UIModeChangeEvent {
  mode: string
  previousMode?: string
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
