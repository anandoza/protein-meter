import { EventBus, EVENTS, type ScanErrorEvent } from '@/utils/events'

export class ErrorView {
  private eventBus = EventBus.getInstance()
  private errorContainer: HTMLElement
  private isVisible = false

  constructor(errorContainerId: string) {
    this.errorContainer = this.getElementById(errorContainerId)
    this.setupEventListeners()
    this.hide()
  }

  private getElementById(id: string): HTMLElement {
    const element = document.getElementById(id)
    if (!element) {
      throw new Error(`Element with id "${id}" not found`)
    }
    return element
  }

  private setupEventListeners(): void {
    this.eventBus.on<ScanErrorEvent>(EVENTS.SCAN_ERROR, (event) => {
      if (event.detail.error) {
        this.showError(event.detail.error)
      } else {
        this.clear()
      }
    })
  }

  private showError(errorMessage: string): void {
    this.errorContainer.textContent = `Error: ${errorMessage}`
    this.errorContainer.className =
      'text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 mb-4'
    this.show()
  }

  show(): void {
    this.isVisible = true
    this.errorContainer.classList.remove('hidden')
  }

  hide(): void {
    this.isVisible = false
    this.errorContainer.classList.add('hidden')
  }

  clear(): void {
    this.errorContainer.textContent = ''
    this.hide()
  }

  isCurrentlyVisible(): boolean {
    return this.isVisible
  }
}
