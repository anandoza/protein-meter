import type { ProductDisplayData } from '@/types'
import { CSS_CLASSES } from '@/utils/constants'

export class ResultsDisplay {
  // DOM elements
  private resultsArea: HTMLElement
  private statusMessage: HTMLElement
  private productInfo: HTMLElement
  private productName: HTMLElement
  private proteinBar: HTMLElement
  private proteinLabel: HTMLElement
  private proteinGrams: HTMLElement
  private energyKcal: HTMLElement
  private barcodeResult: HTMLElement
  private barcodeRow: HTMLElement
  private offLink: HTMLAnchorElement
  private errorMessage: HTMLElement
  private unitLabels: NodeListOf<HTMLElement>

  constructor(
    resultsAreaId: string,
    statusMessageId: string,
    productInfoId: string,
    productNameId: string,
    proteinBarId: string,
    proteinLabelId: string,
    proteinGramsId: string,
    energyKcalId: string,
    barcodeResultId: string,
    barcodeRowId: string,
    offLinkId: string,
    errorMessageId: string,
    unitLabelSelector: string
  ) {
    this.resultsArea = this.getElementById(resultsAreaId)
    this.statusMessage = this.getElementById(statusMessageId)
    this.productInfo = this.getElementById(productInfoId)
    this.productName = this.getElementById(productNameId)
    this.proteinBar = this.getElementById(proteinBarId)
    this.proteinLabel = this.getElementById(proteinLabelId)
    this.proteinGrams = this.getElementById(proteinGramsId)
    this.energyKcal = this.getElementById(energyKcalId)
    this.barcodeResult = this.getElementById(barcodeResultId)
    this.barcodeRow = this.getElementById(barcodeRowId)
    this.offLink = this.getElementById(offLinkId) as HTMLAnchorElement
    this.errorMessage = this.getElementById(errorMessageId)
    this.unitLabels = document.querySelectorAll(unitLabelSelector)

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
    this.showIdleState()
  }

  updateDisplay(data: ProductDisplayData): void {
    this.productName.textContent = data.productName

    // Update protein info
    this.proteinGrams.textContent = data.proteinGrams === 'N/A' ? 'N/A' : data.proteinGrams
    this.energyKcal.textContent = data.energyKcal === 'N/A' ? 'N/A' : data.energyKcal

    // Update protein bar
    this.proteinBar.style.width = `${data.proteinInfo.displayPercentage}%`
    this.proteinBar.textContent = `${data.proteinInfo.actualPercentage}%`
    this.proteinBar.className = 'percentage-bar-fill'
    this.proteinBar.classList.add(data.proteinInfo.colorClass)
    this.proteinLabel.textContent = data.proteinInfo.label

    // Update unit labels
    const unitText = data.isManual ? '/ serving' : '/ 100g'
    this.unitLabels.forEach((label) => {
      label.textContent = unitText
    })

    // Update barcode info
    if (data.barcode) {
      this.barcodeResult.textContent = data.barcode
      this.offLink.href = `https://world.openfoodfacts.org/product/${data.barcode}`
      this.offLink.classList.remove(CSS_CLASSES.HIDDEN)
      this.barcodeRow.classList.remove(CSS_CLASSES.HIDDEN)
    } else {
      this.barcodeResult.textContent = ''
      this.offLink.classList.add(CSS_CLASSES.HIDDEN)
      this.barcodeRow.classList.add(CSS_CLASSES.HIDDEN)
    }

    // Update status and error messages
    this.errorMessage.textContent = data.calculationError || ''

    let statusText = data.calculationError
      ? 'Product data processed, calculation incomplete.'
      : 'Product data processed.'

    if (data.sourceOperation === 'scan') {
      statusText += ' Scan stopped.'
    }

    this.statusMessage.textContent = statusText

    // Show the results
    this.show()
  }

  updateStatus(message: string): void {
    this.statusMessage.textContent = message
  }

  showError(message: string): void {
    this.errorMessage.textContent = message
    this.statusMessage.textContent = 'Error occurred.'
    this.show()
  }

  showIdleState(): void {
    this.statusMessage.textContent = 'Click "Scan Barcode" or "Manual Entry".'
    this.productInfo.classList.add(CSS_CLASSES.HIDDEN)
    this.errorMessage.textContent = ''
  }

  showScanningState(): void {
    this.statusMessage.textContent = 'Starting scanner...'
    this.productInfo.classList.add(CSS_CLASSES.HIDDEN)
    this.errorMessage.textContent = ''
  }

  showManualEntryState(): void {
    this.statusMessage.textContent = 'Enter product details manually.'
    this.productInfo.classList.add(CSS_CLASSES.HIDDEN)
    this.errorMessage.textContent = ''
  }

  showSearchState(): void {
    this.statusMessage.textContent = 'Enter a food name to search.'
    this.productInfo.classList.add(CSS_CLASSES.HIDDEN)
    this.errorMessage.textContent = ''
  }

  show(): void {
    this.resultsArea.classList.remove(CSS_CLASSES.HIDDEN)
    this.productInfo.classList.remove(CSS_CLASSES.HIDDEN)
  }

  hide(): void {
    this.resultsArea.classList.add(CSS_CLASSES.HIDDEN)
  }

  isVisible(): boolean {
    return !this.resultsArea.classList.contains(CSS_CLASSES.HIDDEN)
  }

  clear(): void {
    this.productName.textContent = ''
    this.proteinGrams.textContent = 'N/A'
    this.energyKcal.textContent = 'N/A'
    this.proteinBar.style.width = '0%'
    this.proteinBar.textContent = '0%'
    this.proteinBar.className = 'percentage-bar-fill bg-gray-400'
    this.proteinLabel.textContent = 'N/A'
    this.barcodeResult.textContent = ''
    this.errorMessage.textContent = ''
    this.offLink.classList.add(CSS_CLASSES.HIDDEN)
    this.barcodeRow.classList.add(CSS_CLASSES.HIDDEN)
    this.productInfo.classList.add(CSS_CLASSES.HIDDEN)
  }
}
