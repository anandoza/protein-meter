import { Html5Qrcode } from 'html5-qrcode'
import { SCANNER_CONFIG, CSS_CLASSES, UI_MESSAGES } from '@/utils/constants'
import { EventBus, EVENTS, type BarcodeScannedEvent, type ScanErrorEvent } from '@/utils/events'

export class Scanner {
  private html5QrCode: Html5Qrcode | null = null
  private isScanning = false
  private lastScannedBarcode: string | null = null
  private eventBus = EventBus.getInstance()

  // DOM elements
  private readerElement: HTMLElement
  private scanButton: HTMLButtonElement
  private stopButton: HTMLButtonElement
  private statusElement: HTMLElement

  constructor(
    readerElementId: string,
    scanButtonId: string,
    stopButtonId: string,
    statusElementId: string
  ) {
    this.readerElement = this.getElementById(readerElementId)
    this.scanButton = this.getElementById(scanButtonId) as HTMLButtonElement
    this.stopButton = this.getElementById(stopButtonId) as HTMLButtonElement
    this.statusElement = this.getElementById(statusElementId)

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
    this.initializeScanner()
    this.setupEventListeners()
    this.setInactiveState()
  }

  private initializeScanner(): void {
    if (!this.html5QrCode) {
      this.html5QrCode = new Html5Qrcode(this.readerElement.id)
    }
  }

  private setupEventListeners(): void {
    this.scanButton.addEventListener('click', () => this.startScanning())
    this.stopButton.addEventListener('click', () => this.stopScanning())
  }

  private qrCodeSuccessCallback = (decodedText: string): void => {
    if (this.isScanning && decodedText && decodedText !== this.lastScannedBarcode) {
      this.lastScannedBarcode = decodedText
      this.updateStatus(UI_MESSAGES.BARCODE_DETECTED(decodedText))

      this.eventBus.emit<BarcodeScannedEvent>(EVENTS.BARCODE_SCANNED, {
        barcode: decodedText,
      })
    }
  }

  private qrCodeErrorCallback = (_errorMessage: string): void => {
    // Suppress frequent error messages - they're mostly informational
    // console.warn(`Code scan error = ${errorMessage}`)
  }

  async startScanning(): Promise<void> {
    if (this.isScanning) return

    try {
      this.initializeScanner()
      this.setLoadingState()

      const config = { ...SCANNER_CONFIG }

      await this.html5QrCode!.start(
        { facingMode: 'environment' },
        config,
        this.qrCodeSuccessCallback,
        this.qrCodeErrorCallback
      )

      this.setScanningState()
    } catch (error) {
      this.handleScanError(error)
    }
  }

  stopScanning(): void {
    if (!this.isScanning) return

    this.isScanning = false
    this.setInactiveState()

    if (this.shouldUpdateStatusOnStop()) {
      this.updateStatus(UI_MESSAGES.SCANNER_STOPPED)
    }

    if (!this.html5QrCode || !this.html5QrCode.isScanning) {
      this.cleanup()
      return
    }

    this.html5QrCode
      .stop()
      .then(() => {
        console.log('Scanner stopped via library.')
        this.cleanup()
      })
      .catch((err) => {
        console.error(`Error stopping scanner via library: ${err}`)
        this.cleanup()
      })
  }

  private handleScanError(error: unknown): void {
    console.error(`Unable to start scanning: ${error}`)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    this.updateStatus(
      `${UI_MESSAGES.SCANNER_ERROR}: ${errorMessage}. ${UI_MESSAGES.PERMISSION_ERROR}`
    )

    this.setInactiveState()

    this.eventBus.emit<ScanErrorEvent>(EVENTS.SCAN_ERROR, {
      error: errorMessage,
    })
  }

  private setLoadingState(): void {
    this.readerElement.classList.remove(CSS_CLASSES.SCANNER_INACTIVE)
    this.updateStatus(UI_MESSAGES.SCANNER_STARTING)
    this.updateButtonVisibility(false, false)
  }

  private setScanningState(): void {
    this.isScanning = true
    this.lastScannedBarcode = null
    this.updateStatus(UI_MESSAGES.SCANNER_SCANNING)
    this.updateButtonVisibility(false, true)
  }

  private setInactiveState(): void {
    this.isScanning = false
    this.readerElement.classList.add(CSS_CLASSES.SCANNER_INACTIVE)
    this.updateButtonVisibility(true, false)
  }

  private updateButtonVisibility(showScan: boolean, showStop: boolean): void {
    this.scanButton.classList.toggle(CSS_CLASSES.HIDDEN, !showScan)
    this.stopButton.classList.toggle(CSS_CLASSES.HIDDEN, !showStop)
  }

  private updateStatus(message: string): void {
    this.statusElement.textContent = message
  }

  private shouldUpdateStatusOnStop(): boolean {
    const currentStatus = this.statusElement.textContent || ''
    return currentStatus.includes('Scanning...') || currentStatus.includes('Starting scanner...')
  }

  private cleanup(): void {
    this.readerElement.innerHTML = ''
    this.lastScannedBarcode = null
  }

  // Public API
  isCurrentlyScanning(): boolean {
    return this.isScanning
  }

  getLastScannedBarcode(): string | null {
    return this.lastScannedBarcode
  }

  destroy(): void {
    this.stopScanning()
    this.scanButton.removeEventListener('click', () => this.startScanning())
    this.stopButton.removeEventListener('click', () => this.stopScanning())
  }
}
