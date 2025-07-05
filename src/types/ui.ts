export type UIMode = 'idle' | 'scanning' | 'manual-entry' | 'search'

export type HistoryMode = 'normal' | 'deleting' | 'comparison'

export interface UIState {
  mode: UIMode
  historyMode: HistoryMode
  isScanning: boolean
  lastScannedBarcode: string | null
}

export interface ScannerConfig {
  fps: number
  qrbox: { width: number; height: number }
  aspectRatio: number
  rememberLastUsedCamera: boolean
}

export interface ManualEntryFormData {
  name: string
  calories: number
  protein: number
}

export interface SearchFormData {
  query: string
}

// Event interfaces
export interface BarcodeScannedEvent {
  barcode: string
}

export interface ManualEntrySubmitEvent {
  name: string
  calories: number
  protein: number
}

export interface UIModeChangeEvent {
  mode: string
  previousMode?: string
}

export interface HistoryModeChangeEvent {
  mode: HistoryMode
  previousMode?: HistoryMode
}

export interface HistoryDeleteEvent {
  timestamp: string
}

export interface ComparisonSelectionChangeEvent {
  selectedItems: any[] // Will be HistoryItem[] but avoiding circular imports
}
