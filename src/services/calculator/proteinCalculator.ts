import type { ProteinInfo } from '@/types'

export class ProteinCalculator {
  static CALORIES_PER_GRAM_PROTEIN = 4

  /**
   * Calculate protein percentage of total calories
   */
  static calculateProteinPercentage(proteinGrams: number, totalCalories: number): number {
    if (proteinGrams < 0 || totalCalories <= 0 || isNaN(proteinGrams) || isNaN(totalCalories)) {
      return NaN
    }

    const proteinCalories = proteinGrams * this.CALORIES_PER_GRAM_PROTEIN
    return (proteinCalories / totalCalories) * 100
  }

  /**
   * Get protein classification info based on percentage
   */
  static getProteinInfo(percentage: number): ProteinInfo {
    let colorClass = 'bg-gray-400'
    let fadedColorClass = 'bg-fade-gray-400'
    let label = 'N/A'
    let displayPercentage = 0
    let actualPercentage = 0

    if (isNaN(percentage) || percentage < 0) {
      displayPercentage = 0
      actualPercentage = 0
    } else {
      actualPercentage = percentage
      displayPercentage = Math.min(actualPercentage, 100)

      if (actualPercentage === 0) {
        label = 'Zero'
        colorClass = 'bg-gray-500'
        fadedColorClass = 'bg-fade-gray-500'
      } else if (actualPercentage < 15) {
        label = 'Low'
        colorClass = 'bg-red-500'
        fadedColorClass = 'bg-fade-red-500'
      } else if (actualPercentage < 30) {
        label = 'Okay'
        colorClass = 'bg-yellow-500'
        fadedColorClass = 'bg-fade-yellow-500'
      } else if (actualPercentage < 50) {
        label = 'Good'
        colorClass = 'bg-blue-500'
        fadedColorClass = 'bg-fade-blue-500'
      } else if (actualPercentage < 70) {
        label = 'Great'
        colorClass = 'bg-green-500'
        fadedColorClass = 'bg-fade-green-500'
      } else if (actualPercentage <= 100) {
        label = 'Amazing!'
        colorClass = 'bg-purple-600'
        fadedColorClass = 'bg-fade-purple-600'
      } else {
        label = 'Unreal'
        colorClass = 'bg-gray-700'
        fadedColorClass = 'bg-fade-gray-700'
      }
    }

    return {
      actualPercentage: actualPercentage.toFixed(1),
      displayPercentage: displayPercentage.toFixed(1),
      colorClass,
      fadedColorClass,
      label,
    }
  }

  /**
   * Validate nutrition data and calculate protein percentage
   */
  static processNutritionData(
    proteinGrams: number,
    calories: number
  ): {
    percentage: number
    error: string | null
  } {
    const missing: string[] = []

    if (isNaN(proteinGrams) || proteinGrams < 0) {
      missing.push('protein')
    }

    if (isNaN(calories) || calories <= 0) {
      missing.push('calories')
    }

    if (missing.length > 0) {
      return {
        percentage: NaN,
        error: `Missing/invalid ${missing.join(' & ')}.`,
      }
    }

    const percentage = this.calculateProteinPercentage(proteinGrams, calories)
    return {
      percentage,
      error: null,
    }
  }
}
