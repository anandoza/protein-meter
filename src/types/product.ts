export interface OpenFoodFactsNutriments {
  proteins_100g?: number
  'energy-kcal_100g'?: number
}

export interface OpenFoodFactsProduct {
  code: string
  product_name?: string
  product_name_en?: string
  generic_name?: string
  brands?: string
  nutriments?: OpenFoodFactsNutriments
}

export interface OpenFoodFactsApiResponse {
  status: 0 | 1
  status_verbose?: string
  product?: OpenFoodFactsProduct
}

export interface OpenFoodFactsSearchResponse {
  products: OpenFoodFactsProduct[]
  count: number
  page_count: number
  page_size: number
}

export interface ProteinInfo {
  actualPercentage: string
  displayPercentage: string
  colorClass: string
  fadedColorClass: string
  label: string
}

export interface ProductDisplayData {
  productName: string
  proteinInfo: ProteinInfo
  proteinGrams: string
  energyKcal: string
  barcode: string | null
  calculationError: string | null
  isManual: boolean
  sourceOperation?: string
}
