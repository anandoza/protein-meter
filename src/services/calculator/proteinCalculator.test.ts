import { describe, it, expect } from 'vitest'
import { ProteinCalculator } from './proteinCalculator'

describe('ProteinCalculator', () => {
  describe('calculateProteinPercentage', () => {
    it('calculates protein percentage correctly', () => {
      expect(ProteinCalculator.calculateProteinPercentage(25, 100)).toBe(100) // 25g * 4 = 100cal / 100cal * 100 = 100%
      expect(ProteinCalculator.calculateProteinPercentage(10, 200)).toBe(20) // 10g * 4 = 40cal / 200cal * 100 = 20%
      expect(ProteinCalculator.calculateProteinPercentage(0, 100)).toBe(0) // 0% protein
    })

    it('handles invalid inputs', () => {
      expect(ProteinCalculator.calculateProteinPercentage(-5, 100)).toBeNaN()
      expect(ProteinCalculator.calculateProteinPercentage(10, 0)).toBeNaN()
      expect(ProteinCalculator.calculateProteinPercentage(10, -100)).toBeNaN()
      expect(ProteinCalculator.calculateProteinPercentage(NaN, 100)).toBeNaN()
      expect(ProteinCalculator.calculateProteinPercentage(10, NaN)).toBeNaN()
    })
  })

  describe('getProteinInfo', () => {
    it('classifies protein levels correctly', () => {
      expect(ProteinCalculator.getProteinInfo(0)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "0.0",
          "colorClass": "bg-gray-500",
          "displayPercentage": "0.0",
          "fadedColorClass": "bg-fade-gray-500",
          "label": "Zero",
        }
      `)

      expect(ProteinCalculator.getProteinInfo(10)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "10.0",
          "colorClass": "bg-red-500",
          "displayPercentage": "10.0",
          "fadedColorClass": "bg-fade-red-500",
          "label": "Low",
        }
      `)

      expect(ProteinCalculator.getProteinInfo(25)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "25.0",
          "colorClass": "bg-yellow-500",
          "displayPercentage": "25.0",
          "fadedColorClass": "bg-fade-yellow-500",
          "label": "Okay",
        }
      `)

      expect(ProteinCalculator.getProteinInfo(40)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "40.0",
          "colorClass": "bg-blue-500",
          "displayPercentage": "40.0",
          "fadedColorClass": "bg-fade-blue-500",
          "label": "Good",
        }
      `)

      expect(ProteinCalculator.getProteinInfo(60)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "60.0",
          "colorClass": "bg-green-500",
          "displayPercentage": "60.0",
          "fadedColorClass": "bg-fade-green-500",
          "label": "Great",
        }
      `)

      expect(ProteinCalculator.getProteinInfo(80)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "80.0",
          "colorClass": "bg-purple-600",
          "displayPercentage": "80.0",
          "fadedColorClass": "bg-fade-purple-600",
          "label": "Amazing!",
        }
      `)

      expect(ProteinCalculator.getProteinInfo(120)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "120.0",
          "colorClass": "bg-gray-700",
          "displayPercentage": "100.0",
          "fadedColorClass": "bg-fade-gray-700",
          "label": "Unreal",
        }
      `)
    })

    it('handles invalid percentages', () => {
      expect(ProteinCalculator.getProteinInfo(NaN)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "0.0",
          "colorClass": "bg-gray-400",
          "displayPercentage": "0.0",
          "fadedColorClass": "bg-fade-gray-400",
          "label": "N/A",
        }
      `)

      expect(ProteinCalculator.getProteinInfo(-10)).toMatchInlineSnapshot(`
        {
          "actualPercentage": "0.0",
          "colorClass": "bg-gray-400",
          "displayPercentage": "0.0",
          "fadedColorClass": "bg-fade-gray-400",
          "label": "N/A",
        }
      `)
    })

    it('caps display percentage at 100 but preserves actual percentage', () => {
      const result = ProteinCalculator.getProteinInfo(150)
      expect(result.actualPercentage).toBe('150.0')
      expect(result.displayPercentage).toBe('100.0')
      expect(result.label).toBe('Unreal')
    })
  })

  describe('processNutritionData', () => {
    it('processes valid nutrition data', () => {
      const result = ProteinCalculator.processNutritionData(25, 200)
      expect(result.percentage).toBe(50) // 25g * 4 = 100cal / 200cal * 100 = 50%
      expect(result.error).toBeNull()
    })

    it('validates protein data', () => {
      const result1 = ProteinCalculator.processNutritionData(NaN, 200)
      expect(result1.percentage).toBeNaN()
      expect(result1.error).toBe('Missing/invalid protein.')

      const result2 = ProteinCalculator.processNutritionData(-5, 200)
      expect(result2.percentage).toBeNaN()
      expect(result2.error).toBe('Missing/invalid protein.')
    })

    it('validates calorie data', () => {
      const result1 = ProteinCalculator.processNutritionData(25, NaN)
      expect(result1.percentage).toBeNaN()
      expect(result1.error).toBe('Missing/invalid calories.')

      const result2 = ProteinCalculator.processNutritionData(25, 0)
      expect(result2.percentage).toBeNaN()
      expect(result2.error).toBe('Missing/invalid calories.')

      const result3 = ProteinCalculator.processNutritionData(25, -100)
      expect(result3.percentage).toBeNaN()
      expect(result3.error).toBe('Missing/invalid calories.')
    })

    it('validates both protein and calorie data', () => {
      const result = ProteinCalculator.processNutritionData(NaN, 0)
      expect(result.percentage).toBeNaN()
      expect(result.error).toBe('Missing/invalid protein & calories.')
    })
  })
})
