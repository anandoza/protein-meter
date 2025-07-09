import './styles/main.css'
import { Scanner } from './components/Scanner/Scanner'
import { ManualEntry } from './components/ManualEntry/ManualEntry'
import { SearchFood } from './components/SearchFood/SearchFood'
import { ResultsDisplay } from './components/ResultsDisplay/ResultsDisplay'
import { History } from './components/History/History'
import { ComparisonModal } from './components/ComparisonModal/ComparisonModal'
import { ErrorView } from './components/ErrorView/ErrorView'
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle'
import { ProteinCalculator } from './services/calculator/proteinCalculator'
import { HistoryStorage } from './services/storage/historyStorage'
import { OpenFoodFactsAPI } from './services/api/openFoodFactsAPI'
import { ThemeManager } from './services/theme/themeManager'
import { EventBus, EVENTS } from './utils/events'
import type {
  BarcodeScannedEvent,
  ManualEntrySubmitEvent,
  UIModeChangeEvent,
  ProductDisplayData,
  HistoryItem,
} from './types'

// PWA types
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

class ProteinMeterApp {
  private eventBus = EventBus.getInstance()

  // Components
  private scanner!: Scanner
  private manualEntry!: ManualEntry
  private searchFood!: SearchFood
  private resultsDisplay!: ResultsDisplay
  private errorView!: ErrorView
  private themeToggle?: ThemeToggle

  // UI elements
  private manualEntryBtn!: HTMLButtonElement
  private searchFoodBtn!: HTMLButtonElement

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeApp())
    } else {
      this.initializeApp()
    }
  }

  private initializeApp(): void {
    try {
      this.initializeTheme()
      this.initializeComponents()
      this.setupEventListeners()
      this.setupUIEventListeners()
      this.initializePWA()
      console.log('Protein Meter app initialized successfully')
    } catch (error) {
      console.error('Failed to initialize app:', error)
    }
  }

  private initializeTheme(): void {
    // Initialize theme manager early to apply saved theme
    ThemeManager.getInstance()
  }

  private initializeComponents(): void {
    // Initialize Scanner
    this.scanner = new Scanner('reader', 'scan-barcode-btn', 'stop-scan-btn', 'status-message')

    // Initialize Manual Entry
    this.manualEntry = new ManualEntry(
      'manual-entry-form',
      'entry-form',
      'manual-name',
      'manual-calories',
      'manual-protein',
      'manual-entry-error',
      'cancel-manual-entry-btn'
    )

    // Initialize Search Food
    this.searchFood = new SearchFood(
      'search-food-form-container',
      'search-form',
      'search-query-input',
      'search-error-message',
      'cancel-search-btn',
      'perform-search-btn',
      'search-results-area',
      'search-results-list',
      'no-search-results-message',
      'search-spinner'
    )

    // Initialize Results Display
    this.resultsDisplay = new ResultsDisplay(
      'results-area',
      'status-message',
      'product-info',
      'product-name',
      'protein-bar',
      'protein-label',
      'protein-grams',
      'energy-kcal',
      'barcode-result',
      'barcode-row',
      'off-link',
      'error-message',
      '.unit-label'
    )

    // Initialize History
    new History('history-section', 'history-list', 'no-history-message')

    // Initialize Comparison Modal
    new ComparisonModal(
      'comparison-modal',
      'comparison-canvas-container',
      'download-comparison-btn',
      'close-comparison-modal-btn'
    )

    // Initialize Error View
    this.errorView = new ErrorView('error-display')

    // Initialize Theme Toggle
    const themeToggleContainer = document.getElementById('theme-toggle-container')
    if (themeToggleContainer) {
      this.themeToggle = new ThemeToggle(themeToggleContainer)
      this.themeToggle.show()
    }

    // Get UI buttons
    this.manualEntryBtn = document.getElementById('manual-entry-btn') as HTMLButtonElement
    this.searchFoodBtn = document.getElementById('search-food-btn') as HTMLButtonElement
  }

  private setupEventListeners(): void {
    // Barcode scanned event
    this.eventBus.on<BarcodeScannedEvent>(EVENTS.BARCODE_SCANNED, (event) => {
      this.handleBarcodeScanned(event.detail.barcode)
    })

    // Manual entry submit event
    this.eventBus.on<ManualEntrySubmitEvent>(EVENTS.MANUAL_ENTRY_SUBMIT, (event) => {
      this.handleManualEntrySubmit(event.detail)
    })

    // UI mode change event
    this.eventBus.on<UIModeChangeEvent>(EVENTS.UI_MODE_CHANGE, (event) => {
      this.handleUIModeChange(event.detail.mode)
    })
  }

  private setupUIEventListeners(): void {
    // Manual entry button
    this.manualEntryBtn.addEventListener('click', () => {
      this.errorView.clear()
      this.showManualEntry()
    })

    // Search food button
    this.searchFoodBtn.addEventListener('click', () => {
      this.errorView.clear()
      this.showSearchFood()
    })
  }

  private async handleBarcodeScanned(barcode: string): Promise<void> {
    this.resultsDisplay.updateStatus(`Barcode detected: ${barcode}. Fetching data...`)

    try {
      const product = await OpenFoodFactsAPI.getProduct(barcode)
      const productName = OpenFoodFactsAPI.extractProductName(product)
      const nutrition = OpenFoodFactsAPI.extractNutrition(product)

      const result = ProteinCalculator.processNutritionData(
        nutrition.protein100g,
        nutrition.energyKcal100g
      )

      const proteinInfo = ProteinCalculator.getProteinInfo(result.percentage)

      const displayData: ProductDisplayData = {
        productName,
        proteinInfo,
        proteinGrams: nutrition.protein100g.toFixed(1),
        energyKcal: nutrition.energyKcal100g.toFixed(0),
        barcode,
        calculationError: result.error,
        isManual: false,
        sourceOperation: 'scan',
      }

      this.resultsDisplay.updateDisplay(displayData)

      // Add to history if calculation was successful
      if (!result.error && proteinInfo.label !== 'N/A') {
        this.addToHistory(displayData)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.resultsDisplay.showError(
        `Failed to fetch product data: ${errorMessage}. Please try again.`
      )
    }
  }

  private handleManualEntrySubmit(data: { name: string; calories: number; protein: number }): void {
    const result = ProteinCalculator.processNutritionData(data.protein, data.calories)
    const proteinInfo = ProteinCalculator.getProteinInfo(result.percentage)

    const displayData: ProductDisplayData = {
      productName: data.name || 'Manual Entry',
      proteinInfo,
      proteinGrams: data.protein.toFixed(1),
      energyKcal: data.calories.toFixed(0),
      barcode: null,
      calculationError: result.error,
      isManual: true,
      sourceOperation: 'manual',
    }

    this.resultsDisplay.updateDisplay(displayData)

    // Add to history if calculation was successful
    if (!result.error && proteinInfo.label !== 'N/A') {
      this.addToHistory(displayData)
    }

    this.showResults()
  }

  private handleUIModeChange(mode: string): void {
    switch (mode) {
      case 'idle':
        this.showIdle()
        break
      case 'scanning':
        this.showScanning()
        break
      case 'manual-entry':
        this.showManualEntry()
        break
      case 'search':
        this.showSearchFood()
        break
    }
  }

  private addToHistory(displayData: ProductDisplayData): void {
    const historyItem: HistoryItem = {
      barcode: displayData.barcode,
      productName: displayData.productName,
      proteinActualPercentage: displayData.proteinInfo.actualPercentage,
      proteinDisplayPercentage: displayData.proteinInfo.displayPercentage,
      proteinLabel: displayData.proteinInfo.label,
      colorClass: displayData.proteinInfo.colorClass,
      fadedColorClass: displayData.proteinInfo.fadedColorClass,
      proteinGrams: displayData.proteinGrams,
      energyKcal: displayData.energyKcal,
      timestamp: new Date().toISOString(),
      errorMessage: displayData.calculationError,
      isManual: displayData.isManual,
    }

    HistoryStorage.add(historyItem)
    console.log('Added to history:', historyItem)

    // Emit history updated event
    this.eventBus.emit(EVENTS.HISTORY_UPDATED, {})
  }

  // UI State Management
  private showIdle(): void {
    this.hideAllForms()
    this.resultsDisplay.showIdleState()
    this.resultsDisplay.show()
  }

  private showScanning(): void {
    this.hideAllForms()
    this.resultsDisplay.showScanningState()
    this.resultsDisplay.show()
  }

  private showManualEntry(): void {
    if (this.scanner.isCurrentlyScanning()) {
      this.scanner.stopScanning()
    }
    this.hideAllForms()
    this.manualEntry.show()
    this.resultsDisplay.hide()
  }

  private showSearchFood(): void {
    if (this.scanner.isCurrentlyScanning()) {
      this.scanner.stopScanning()
    }
    this.hideAllForms()
    this.searchFood.show()
    this.resultsDisplay.hide()
  }

  private showResults(): void {
    this.hideAllForms()
    this.resultsDisplay.show()
  }

  private hideAllForms(): void {
    this.manualEntry.hide()
    this.searchFood.hide()
  }

  private initializePWA(): void {
    // PWA installation
    let deferredPrompt: BeforeInstallPromptEvent | null = null
    const installBtn = document.getElementById('install-pwa-btn') as HTMLButtonElement

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      if (installBtn) {
        installBtn.classList.remove('hidden')
      }
    })

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return

        installBtn.classList.add('hidden')
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to install prompt: ${outcome}`)
        deferredPrompt = null
      })
    }

    window.addEventListener('appinstalled', () => {
      if (installBtn) {
        installBtn.classList.add('hidden')
      }
      deferredPrompt = null
      console.log('PWA was installed')
    })
  }
}

// Initialize the app
new ProteinMeterApp()
