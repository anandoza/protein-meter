import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ManualEntry } from './ManualEntry'
import { EVENTS } from '@/utils/events'

// Mock DOM elements
const createMockElement = (id: string, tagName = 'div') => {
  const element = document.createElement(tagName)
  element.id = id

  const classListMock = {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn().mockReturnValue(false),
  }

  Object.defineProperty(element, 'classList', {
    value: classListMock,
    writable: true,
  })

  return element
}

describe('ManualEntry', () => {
  let manualEntry: ManualEntry
  let formContainer: HTMLElement
  let form: HTMLFormElement
  let nameInput: HTMLInputElement
  let caloriesInput: HTMLInputElement
  let proteinInput: HTMLInputElement
  let errorElement: HTMLElement
  let cancelButton: HTMLButtonElement

  beforeEach(() => {
    vi.clearAllMocks()

    // Create mock DOM elements
    formContainer = createMockElement('manual-form-container')
    form = createMockElement('manual-form', 'form') as HTMLFormElement
    nameInput = createMockElement('name-input', 'input') as HTMLInputElement
    caloriesInput = createMockElement('calories-input', 'input') as HTMLInputElement
    proteinInput = createMockElement('protein-input', 'input') as HTMLInputElement
    errorElement = createMockElement('error-element')
    cancelButton = createMockElement('cancel-button', 'button') as HTMLButtonElement

    // Add methods to form mock
    form.reset = vi.fn()

    // Add elements to DOM
    document.body.appendChild(formContainer)
    document.body.appendChild(form)
    document.body.appendChild(nameInput)
    document.body.appendChild(caloriesInput)
    document.body.appendChild(proteinInput)
    document.body.appendChild(errorElement)
    document.body.appendChild(cancelButton)

    // Mock getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      switch (id) {
        case 'manual-form-container':
          return formContainer
        case 'manual-form':
          return form
        case 'name-input':
          return nameInput
        case 'calories-input':
          return caloriesInput
        case 'protein-input':
          return proteinInput
        case 'error-element':
          return errorElement
        case 'cancel-button':
          return cancelButton
        default:
          return null
      }
    })

    manualEntry = new ManualEntry(
      'manual-form-container',
      'manual-form',
      'name-input',
      'calories-input',
      'protein-input',
      'error-element',
      'cancel-button'
    )
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('initializes with DOM elements', () => {
      expect(document.getElementById).toHaveBeenCalledWith('manual-form-container')
      expect(document.getElementById).toHaveBeenCalledWith('manual-form')
      expect(document.getElementById).toHaveBeenCalledWith('name-input')
      expect(document.getElementById).toHaveBeenCalledWith('calories-input')
      expect(document.getElementById).toHaveBeenCalledWith('protein-input')
      expect(document.getElementById).toHaveBeenCalledWith('error-element')
      expect(document.getElementById).toHaveBeenCalledWith('cancel-button')
    })

    it('throws error for missing elements', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      expect(() => {
        new ManualEntry(
          'missing',
          'manual-form',
          'name-input',
          'calories-input',
          'protein-input',
          'error-element',
          'cancel-button'
        )
      }).toThrow('Element with id "missing" not found')
    })

    it('hides form initially', () => {
      expect((formContainer.classList as any).add).toHaveBeenCalledWith('hidden')
    })
  })

  describe('show', () => {
    it('shows form and focuses name input', () => {
      const focusSpy = vi.spyOn(nameInput, 'focus').mockImplementation(() => {})

      manualEntry.show()

      expect((formContainer.classList as any).remove).toHaveBeenCalledWith('hidden')
      expect(form.reset).toHaveBeenCalled()
      expect(focusSpy).toHaveBeenCalled()
    })
  })

  describe('hide', () => {
    it('hides form', () => {
      manualEntry.hide()

      expect((formContainer.classList as any).add).toHaveBeenCalledWith('hidden')
    })
  })

  describe('form submission', () => {
    it('submits valid form data', () => {
      nameInput.value = 'Test Product'
      caloriesInput.value = '200'
      proteinInput.value = '25'

      const eventSpy = vi.fn()
      const eventBus = (manualEntry as any).eventBus
      eventBus.on(EVENTS.MANUAL_ENTRY_SUBMIT, eventSpy)

      const submitEvent = new Event('submit')
      form.dispatchEvent(submitEvent)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            name: 'Test Product',
            calories: 200,
            protein: 25,
          },
        })
      )
    })

    it('handles empty name field', () => {
      nameInput.value = ''
      caloriesInput.value = '200'
      proteinInput.value = '25'

      const eventSpy = vi.fn()
      const eventBus = (manualEntry as any).eventBus
      eventBus.on(EVENTS.MANUAL_ENTRY_SUBMIT, eventSpy)

      const submitEvent = new Event('submit')
      form.dispatchEvent(submitEvent)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            name: '',
            calories: 200,
            protein: 25,
          },
        })
      )
    })

    it('validates calories input', () => {
      nameInput.value = 'Test Product'
      caloriesInput.value = 'invalid'
      proteinInput.value = '25'

      const submitEvent = new Event('submit')
      form.dispatchEvent(submitEvent)

      expect(errorElement.textContent).toContain('valid positive numbers for calories')
      expect((errorElement.classList as any).remove).toHaveBeenCalledWith('hidden')
    })

    it('validates protein input', () => {
      nameInput.value = 'Test Product'
      caloriesInput.value = '200'
      proteinInput.value = '-5'

      const submitEvent = new Event('submit')
      form.dispatchEvent(submitEvent)

      expect(errorElement.textContent).toContain('protein can be 0')
      expect((errorElement.classList as any).remove).toHaveBeenCalledWith('hidden')
    })

    it('allows zero protein', () => {
      nameInput.value = 'Test Product'
      caloriesInput.value = '200'
      proteinInput.value = '0'

      const eventSpy = vi.fn()
      const eventBus = (manualEntry as any).eventBus
      eventBus.on(EVENTS.MANUAL_ENTRY_SUBMIT, eventSpy)

      const submitEvent = new Event('submit')
      form.dispatchEvent(submitEvent)

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            name: 'Test Product',
            calories: 200,
            protein: 0,
          },
        })
      )
    })

    it('hides form after successful submission', () => {
      nameInput.value = 'Test Product'
      caloriesInput.value = '200'
      proteinInput.value = '25'

      const submitEvent = new Event('submit')
      form.dispatchEvent(submitEvent)

      expect((formContainer.classList as any).add).toHaveBeenCalledWith('hidden')
    })
  })

  describe('cancel button', () => {
    it('hides form and emits UI mode change', () => {
      const eventSpy = vi.fn()
      const eventBus = (manualEntry as any).eventBus
      eventBus.on(EVENTS.UI_MODE_CHANGE, eventSpy)

      cancelButton.click()

      expect((formContainer.classList as any).add).toHaveBeenCalledWith('hidden')
      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { mode: 'idle' },
        })
      )
    })
  })

  describe('public API', () => {
    it('returns visibility state', () => {
      ;(formContainer.classList as any).contains.mockReturnValue(true)
      expect(manualEntry.isVisible()).toBe(false) // Hidden = true means visible = false
      ;(formContainer.classList as any).contains.mockReturnValue(false)
      expect(manualEntry.isVisible()).toBe(true) // Hidden = false means visible = true
    })

    it('resets form', () => {
      manualEntry.reset()

      expect(form.reset).toHaveBeenCalled()
      expect((errorElement.classList as any).add).toHaveBeenCalledWith('hidden')
    })

    it('cleans up on destroy', () => {
      const destroySpy = vi.spyOn(manualEntry, 'destroy')

      manualEntry.destroy()

      expect(destroySpy).toHaveBeenCalled()
    })
  })
})
