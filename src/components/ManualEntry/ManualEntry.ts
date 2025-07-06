import type { ManualEntryFormData } from '@/types'
import { EventBus, EVENTS, type ManualEntrySubmitEvent } from '@/utils/events'
import { CSS_CLASSES } from '@/utils/constants'

export class ManualEntry {
  private eventBus = EventBus.getInstance()

  // DOM elements
  private formContainer: HTMLElement
  private form: HTMLFormElement
  private nameInput: HTMLInputElement
  private caloriesInput: HTMLInputElement
  private proteinInput: HTMLInputElement
  private errorElement: HTMLElement
  private cancelButton: HTMLButtonElement

  constructor(
    formContainerId: string,
    formId: string,
    nameInputId: string,
    caloriesInputId: string,
    proteinInputId: string,
    errorElementId: string,
    cancelButtonId: string
  ) {
    this.formContainer = this.getElementById(formContainerId)
    this.form = this.getElementById(formId) as HTMLFormElement
    this.nameInput = this.getElementById(nameInputId) as HTMLInputElement
    this.caloriesInput = this.getElementById(caloriesInputId) as HTMLInputElement
    this.proteinInput = this.getElementById(proteinInputId) as HTMLInputElement
    this.errorElement = this.getElementById(errorElementId)
    this.cancelButton = this.getElementById(cancelButtonId) as HTMLButtonElement

    this.initialize()
  }

  private getElementById(id: string): HTMLElement {
    const element = document.getElementById(id)
    if (!element) {
      throw new Error(`Element with id "${id}" not found`)
    }
    return element
  }

  private initialize(): void {
    this.setupEventListeners()
    this.hide()
  }

  private setupEventListeners(): void {
    this.form.addEventListener('submit', this.handleSubmit.bind(this))
    this.cancelButton.addEventListener('click', this.handleCancel.bind(this))
  }

  private handleSubmit(event: Event): void {
    event.preventDefault()
    this.hideError()

    const formData = this.getFormData()
    const validation = this.validateFormData(formData)

    if (!validation.isValid) {
      this.showError(validation.error!)
      return
    }

    this.eventBus.emit<ManualEntrySubmitEvent>(EVENTS.MANUAL_ENTRY_SUBMIT, {
      name: formData.name,
      calories: formData.calories,
      protein: formData.protein,
    })

    this.hide()
  }

  private handleCancel(): void {
    this.hide()
    this.eventBus.emit(EVENTS.UI_MODE_CHANGE, { mode: 'idle' })
  }

  private getFormData(): ManualEntryFormData {
    return {
      name: this.nameInput.value.trim(),
      calories: parseFloat(this.caloriesInput.value),
      protein: parseFloat(this.proteinInput.value),
    }
  }

  private validateFormData(data: ManualEntryFormData): {
    isValid: boolean
    error?: string
  } {
    if (isNaN(data.calories) || data.calories <= 0) {
      return {
        isValid: false,
        error: 'Please enter valid positive numbers for calories.',
      }
    }

    if (isNaN(data.protein) || data.protein < 0) {
      return {
        isValid: false,
        error: 'Please enter valid positive numbers for protein (protein can be 0).',
      }
    }

    return { isValid: true }
  }

  private showError(message: string): void {
    this.errorElement.textContent = message
    this.errorElement.classList.remove(CSS_CLASSES.HIDDEN)
  }

  private hideError(): void {
    this.errorElement.classList.add(CSS_CLASSES.HIDDEN)
  }

  // Public API
  show(): void {
    this.formContainer.classList.remove(CSS_CLASSES.HIDDEN)
    this.reset()
    this.nameInput.focus()
  }

  hide(): void {
    this.formContainer.classList.add(CSS_CLASSES.HIDDEN)
  }

  reset(): void {
    this.form.reset()
    this.hideError()
  }

  isVisible(): boolean {
    return !this.formContainer.classList.contains(CSS_CLASSES.HIDDEN)
  }

  destroy(): void {
    this.form.removeEventListener('submit', this.handleSubmit.bind(this))
    this.cancelButton.removeEventListener('click', this.handleCancel.bind(this))
  }
}
