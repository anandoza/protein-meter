import type { SearchFormData, OpenFoodFactsProduct } from '@/types'
import { EventBus, EVENTS } from '@/utils/events'
import { CSS_CLASSES } from '@/utils/constants'
import { OpenFoodFactsAPI } from '@/services/api/openFoodFactsAPI'
import { ANIMATION_TIMINGS } from '@/utils/animations'

export class SearchFood {
  private eventBus = EventBus.getInstance()

  // DOM elements
  private formContainer: HTMLElement
  private form: HTMLFormElement
  private queryInput: HTMLInputElement
  private errorElement: HTMLElement
  private cancelButton: HTMLButtonElement
  private searchButton: HTMLButtonElement
  private resultsArea: HTMLElement
  private resultsListElement: HTMLElement
  private noResultsMessage: HTMLElement
  private spinner: HTMLElement

  constructor(
    formContainerId: string,
    formId: string,
    queryInputId: string,
    errorElementId: string,
    cancelButtonId: string,
    searchButtonId: string,
    resultsAreaId: string,
    resultsListId: string,
    noResultsMessageId: string,
    spinnerId: string
  ) {
    this.formContainer = this.getElementById(formContainerId)
    this.form = this.getElementById(formId) as HTMLFormElement
    this.queryInput = this.getElementById(queryInputId) as HTMLInputElement
    this.errorElement = this.getElementById(errorElementId)
    this.cancelButton = this.getElementById(cancelButtonId) as HTMLButtonElement
    this.searchButton = this.getElementById(searchButtonId) as HTMLButtonElement
    this.resultsArea = this.getElementById(resultsAreaId)
    this.resultsListElement = this.getElementById(resultsListId)
    this.noResultsMessage = this.getElementById(noResultsMessageId)
    this.spinner = this.getElementById(spinnerId)

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

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault()
    this.hideError()

    const formData = this.getFormData()
    const validation = this.validateFormData(formData)

    if (!validation.isValid) {
      this.showError(validation.error!)
      this.queryInput.focus()
      return
    }

    await this.performSearch(formData.query)
  }

  private handleCancel(): void {
    this.hide()
    this.eventBus.emit(EVENTS.UI_MODE_CHANGE, { mode: 'idle' })
  }

  private getFormData(): SearchFormData {
    return {
      query: this.queryInput.value.trim(),
    }
  }

  private validateFormData(data: SearchFormData): {
    isValid: boolean
    error?: string
  } {
    if (!data.query) {
      return {
        isValid: false,
        error: 'Please enter a food name to search.',
      }
    }

    return { isValid: true }
  }

  private async performSearch(query: string): Promise<void> {
    this.setLoadingState()

    try {
      const products = await OpenFoodFactsAPI.searchProducts(query)
      this.displayResults(products, query)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      this.showError(`Search failed: ${errorMessage}. Check connection or try again.`)
    } finally {
      this.setIdleState()
    }
  }

  private displayResults(products: OpenFoodFactsProduct[], query: string): void {
    this.resultsListElement.innerHTML = ''

    if (!products || products.length === 0) {
      this.showNoResults(`No products found for "${query}". Try different keywords.`)
      return
    }

    this.hideNoResults()

    products.forEach((product) => {
      const item = this.createResultItem(product)
      this.resultsListElement.appendChild(item)
    })
  }

  private createResultItem(product: OpenFoodFactsProduct): HTMLElement {
    const item = document.createElement('div')
    item.classList.add(
      'p-3',
      'mb-2',
      'border',
      'rounded-md',
      'hover:bg-gray-200',
      'cursor-pointer',
      'transition',
      'duration-150',
      'ease-in-out'
    )
    item.setAttribute('data-barcode', product.code)

    const productName = OpenFoodFactsAPI.extractProductName(product)
    const brandName = OpenFoodFactsAPI.extractBrandName(product)

    item.innerHTML = `
      <p class="font-semibold text-gray-800">${this.escapeHtml(productName)}</p>
      ${brandName ? `<p class="text-sm text-gray-600">${this.escapeHtml(brandName)}</p>` : ''}
    `

    item.addEventListener('click', () => {
      this.handleProductClick(product.code)
    })

    return item
  }

  private handleProductClick(barcode: string): void {
    if (!barcode) {
      console.error('Barcode not found on search result item.')
      return
    }

    // Hide search UI and emit barcode scanned event
    this.hide()
    this.eventBus.emit(EVENTS.BARCODE_SCANNED, { barcode })
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private setLoadingState(): void {
    this.spinner.classList.remove(CSS_CLASSES.HIDDEN)
    this.searchButton.disabled = true
    this.cancelButton.disabled = true
    this.hideNoResults()
    this.hideError()
  }

  private setIdleState(): void {
    this.spinner.classList.add(CSS_CLASSES.HIDDEN)
    this.searchButton.disabled = false
    this.cancelButton.disabled = false
  }

  private showError(message: string): void {
    this.errorElement.textContent = message
    this.errorElement.classList.remove(CSS_CLASSES.HIDDEN)
  }

  private hideError(): void {
    this.errorElement.classList.add(CSS_CLASSES.HIDDEN)
  }

  private showNoResults(message: string): void {
    this.noResultsMessage.textContent = message
    this.noResultsMessage.style.display = 'block'
  }

  private hideNoResults(): void {
    this.noResultsMessage.style.display = 'none'
  }

  // Animation methods
  async animateIn(): Promise<void> {
    this.formContainer.classList.remove(CSS_CLASSES.HIDDEN)
    this.resultsArea.classList.remove(CSS_CLASSES.HIDDEN)
    this.formContainer.classList.add('animating-in')
    
    return new Promise(resolve => {
      setTimeout(() => {
        this.formContainer.classList.remove('animating-in')
        this.queryInput.focus()
        resolve()
      }, ANIMATION_TIMINGS.FORM_TRANSITION)
    })
  }

  async animateOut(): Promise<void> {
    return new Promise(resolve => {
      this.formContainer.classList.add(CSS_CLASSES.HIDDEN)
      this.resultsArea.classList.add(CSS_CLASSES.HIDDEN)
      setTimeout(resolve, ANIMATION_TIMINGS.FORM_TRANSITION)
    })
  }

  // Public API
  show(): void {
    this.reset()
    this.animateIn()
  }

  hide(): void {
    this.animateOut()
  }

  reset(): void {
    this.form.reset()
    this.hideError()
    this.resultsListElement.innerHTML = ''
    this.showNoResults('Type a food name and click search.')
  }

  isVisible(): boolean {
    return !this.formContainer.classList.contains(CSS_CLASSES.HIDDEN)
  }

  destroy(): void {
    this.form.removeEventListener('submit', this.handleSubmit.bind(this))
    this.cancelButton.removeEventListener('click', this.handleCancel.bind(this))
  }
}
