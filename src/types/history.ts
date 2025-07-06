export interface HistoryItem {
  barcode: string | null
  productName: string
  proteinActualPercentage: string
  proteinDisplayPercentage: string
  proteinLabel: string
  colorClass: string
  fadedColorClass: string
  proteinGrams: string
  energyKcal: string
  timestamp: string
  errorMessage: string | null
  isManual: boolean
}

export interface ComparisonSelection {
  selectedItems: HistoryItem[]
  isActive: boolean
}
