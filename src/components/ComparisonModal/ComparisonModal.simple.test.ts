import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComparisonModal } from './ComparisonModal'

// Simple mock DOM elements
const createMockElement = (id: string) => ({
  id,
  addEventListener: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn().mockReturnValue(false),
  },
  innerHTML: '',
  appendChild: vi.fn(),
  style: {},
})

describe('ComparisonModal - Basic Tests', () => {
  beforeEach(() => {
    // Mock getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      return createMockElement(id) as any
    })

    // Mock addEventListener
    vi.spyOn(document, 'addEventListener').mockImplementation(() => {})

    // Mock body
    Object.defineProperty(document, 'body', {
      value: { style: {} },
      writable: true,
    })
  })

  it('creates ComparisonModal instance successfully', () => {
    const modal = new ComparisonModal(
      'comparison-modal',
      'comparison-canvas-container',
      'download-comparison-btn',
      'close-comparison-modal-btn'
    )

    expect(modal).toBeInstanceOf(ComparisonModal)
    expect(modal.isVisible()).toBe(true) // classList.contains returns false, so !false = true
  })

  it('throws error for missing elements', () => {
    vi.spyOn(document, 'getElementById').mockReturnValue(null)

    expect(() => {
      new ComparisonModal('invalid', 'invalid', 'invalid', 'invalid')
    }).toThrow('Element with id "invalid" not found')
  })
})
