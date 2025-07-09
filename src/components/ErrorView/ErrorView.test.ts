import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ErrorView } from './ErrorView'
import { EventBus, EVENTS } from '@/utils/events'

// Mock the EventBus
vi.mock('@/utils/events', () => ({
  EventBus: {
    getInstance: vi.fn(() => ({
      on: vi.fn(),
      emit: vi.fn(),
    })),
  },
  EVENTS: {
    SCAN_ERROR: 'scan-error',
  },
}))

describe('ErrorView', () => {
  let mockEventBus: any
  let errorView: ErrorView
  let mockElement: HTMLElement

  beforeEach(() => {
    // Create a mock HTML element
    mockElement = document.createElement('div')
    mockElement.id = 'error-display'
    document.body.appendChild(mockElement)

    // Mock EventBus
    mockEventBus = {
      on: vi.fn(),
      emit: vi.fn(),
    }

    vi.mocked(EventBus.getInstance).mockReturnValue(mockEventBus)

    // Create ErrorView instance
    errorView = new ErrorView('error-display')
  })

  afterEach(() => {
    document.body.removeChild(mockElement)
    vi.clearAllMocks()
  })

  it('should throw error if element not found', () => {
    expect(() => new ErrorView('non-existent-id')).toThrow(
      'Element with id "non-existent-id" not found'
    )
  })

  it('should initialize with hidden state', () => {
    expect(mockElement.classList.contains('hidden')).toBe(true)
    expect(errorView.isCurrentlyVisible()).toBe(false)
  })

  it('should register event listener for SCAN_ERROR', () => {
    expect(mockEventBus.on).toHaveBeenCalledWith(EVENTS.SCAN_ERROR, expect.any(Function))
  })

  it('should show error when SCAN_ERROR event is emitted with error message', () => {
    // Get the registered event handler
    const eventHandler = mockEventBus.on.mock.calls[0][1]

    // Simulate error event
    const errorEvent = {
      detail: { error: 'Test error message' },
    }

    eventHandler(errorEvent)

    expect(mockElement.textContent).toBe('Error: Test error message')
    expect(mockElement.className).toBe(
      'text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-4'
    )
    expect(mockElement.classList.contains('hidden')).toBe(false)
    expect(errorView.isCurrentlyVisible()).toBe(true)
  })

  it('should clear error when SCAN_ERROR event is emitted with empty error message', () => {
    // First show an error
    errorView.show()
    mockElement.textContent = 'Some error'

    // Get the registered event handler
    const eventHandler = mockEventBus.on.mock.calls[0][1]

    // Simulate clear event
    const clearEvent = {
      detail: { error: '' },
    }

    eventHandler(clearEvent)

    expect(mockElement.textContent).toBe('')
    expect(mockElement.classList.contains('hidden')).toBe(true)
    expect(errorView.isCurrentlyVisible()).toBe(false)
  })

  it('should show and hide error display', () => {
    // Initially hidden
    expect(errorView.isCurrentlyVisible()).toBe(false)
    expect(mockElement.classList.contains('hidden')).toBe(true)

    // Show error
    errorView.show()
    expect(errorView.isCurrentlyVisible()).toBe(true)
    expect(mockElement.classList.contains('hidden')).toBe(false)

    // Hide error
    errorView.hide()
    expect(errorView.isCurrentlyVisible()).toBe(false)
    expect(mockElement.classList.contains('hidden')).toBe(true)
  })

  it('should clear error content and hide', () => {
    // Set some error content
    mockElement.textContent = 'Some error'
    errorView.show()

    // Clear should reset content and hide
    errorView.clear()

    expect(mockElement.textContent).toBe('')
    expect(mockElement.classList.contains('hidden')).toBe(true)
    expect(errorView.isCurrentlyVisible()).toBe(false)
  })
})
