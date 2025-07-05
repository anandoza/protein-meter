import type { HistoryItem, HistoryMode } from '@/types'
import { HistoryStorage } from '@/services/storage/historyStorage'
import {
  EventBus,
  EVENTS,
  type HistoryModeChangeEvent,
  type HistoryDeleteEvent,
  type ComparisonSelectionChangeEvent,
} from '@/utils/events'

export class History {
  private eventBus = EventBus.getInstance()
  private currentMode: HistoryMode = 'normal'
  private selectedForComparison: HistoryItem[] = []

  // DOM elements
  private historyList: HTMLElement
  private noHistoryMessage: HTMLElement
  private compareModeBtn: HTMLButtonElement
  private manageHistoryBtn: HTMLButtonElement
  private clearAllBtn: HTMLButtonElement
  private comparisonActionsDiv: HTMLElement
  private generateComparisonBtn: HTMLButtonElement

  constructor(historySectionId: string, historyListId: string, noHistoryMessageId: string) {
    // Get all the required DOM elements
    this.getElementById(historySectionId) // Just verify it exists
    this.historyList = this.getElementById(historyListId)
    this.noHistoryMessage = this.getElementById(noHistoryMessageId)
    this.compareModeBtn = this.getElementById('compare-mode-btn') as HTMLButtonElement
    this.manageHistoryBtn = this.getElementById('manage-history-btn') as HTMLButtonElement
    this.clearAllBtn = this.getElementById('clear-all-btn') as HTMLButtonElement
    this.comparisonActionsDiv = this.getElementById('comparison-actions')
    this.generateComparisonBtn = this.getElementById(
      'generate-comparison-image-btn'
    ) as HTMLButtonElement

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
    this.loadAndRender()
    this.setupEventListeners()
    this.setupActionButtons()
  }

  private setupEventListeners(): void {
    // Listen for history updates
    this.eventBus.on(EVENTS.HISTORY_UPDATED, () => {
      this.loadAndRender()
    })

    // Listen for history delete events
    this.eventBus.on(EVENTS.HISTORY_DELETE, (event: CustomEvent<HistoryDeleteEvent>) => {
      this.deleteHistoryItem(event.detail.timestamp)
    })

    // Listen for clear all events
    this.eventBus.on(EVENTS.HISTORY_CLEAR_ALL, () => {
      this.clearAllHistory()
    })
  }

  private setupActionButtons(): void {
    // Compare mode button
    this.compareModeBtn.addEventListener('click', () => {
      this.toggleComparisonMode()
    })

    // Manage history button (delete mode)
    this.manageHistoryBtn.addEventListener('click', () => {
      this.toggleDeleteMode()
    })

    // Clear all button
    this.clearAllBtn.addEventListener('click', () => {
      this.clearAllHistory()
    })

    // Generate comparison button
    this.generateComparisonBtn.addEventListener('click', () => {
      if (this.selectedForComparison.length >= 2) {
        this.eventBus.emit('generate-comparison', { items: this.selectedForComparison })
      } else {
        alert('Please select at least two items to compare.')
      }
    })
  }

  private toggleComparisonMode(): void {
    if (this.currentMode === 'deleting') {
      // Switch from delete mode to comparison mode
      this.currentMode = 'comparison'
    } else if (this.currentMode === 'comparison') {
      // Exit comparison mode
      this.currentMode = 'normal'
      this.selectedForComparison = []
    } else {
      // Enter comparison mode
      this.currentMode = 'comparison'
      this.selectedForComparison = []
    }

    this.updateModeUI()
    this.loadAndRender()
    this.emitModeChange()
  }

  private toggleDeleteMode(): void {
    if (this.currentMode === 'comparison') {
      // Switch from comparison mode to delete mode
      this.currentMode = 'deleting'
      this.selectedForComparison = []
    } else if (this.currentMode === 'deleting') {
      // Exit delete mode
      this.currentMode = 'normal'
    } else {
      // Enter delete mode
      this.currentMode = 'deleting'
    }

    this.updateModeUI()
    this.loadAndRender()
    this.emitModeChange()
  }

  private updateModeUI(): void {
    // Update button states and text
    const hasHistory = !HistoryStorage.isEmpty()

    // Enable/disable buttons based on history
    this.compareModeBtn.disabled = !hasHistory
    this.manageHistoryBtn.disabled = !hasHistory

    // Update button text and styles based on current mode
    if (this.currentMode === 'comparison') {
      this.compareModeBtn.textContent = 'Cancel'
      this.compareModeBtn.className = 'text-sm text-red-500 hover:text-red-700 hover:underline'
      this.compareModeBtn.classList.remove('hidden')
      this.manageHistoryBtn.classList.add('hidden') // Hide Manage History button in compare mode
      this.clearAllBtn.classList.add('hidden')
      this.comparisonActionsDiv.classList.remove('hidden')
    } else if (this.currentMode === 'deleting') {
      this.compareModeBtn.classList.add('hidden') // Hide Compare button in delete mode
      this.manageHistoryBtn.textContent = 'Done'
      this.manageHistoryBtn.className = 'text-sm text-blue-500 hover:text-blue-700 hover:underline'
      this.manageHistoryBtn.classList.remove('hidden')
      this.clearAllBtn.classList.remove('hidden')
      this.comparisonActionsDiv.classList.add('hidden')
    } else {
      this.compareModeBtn.textContent = 'Compare'
      this.compareModeBtn.className =
        'text-sm text-green-500 hover:text-green-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed'
      this.compareModeBtn.classList.remove('hidden')
      this.manageHistoryBtn.textContent = 'Manage History'
      this.manageHistoryBtn.className =
        'text-sm text-blue-500 hover:text-blue-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed'
      this.manageHistoryBtn.classList.remove('hidden')
      this.clearAllBtn.classList.add('hidden')
      this.comparisonActionsDiv.classList.add('hidden')
    }

    // Update generate comparison button state
    this.generateComparisonBtn.disabled = this.selectedForComparison.length < 2
  }

  private emitModeChange(): void {
    this.eventBus.emit<HistoryModeChangeEvent>(EVENTS.HISTORY_MODE_CHANGE, {
      mode: this.currentMode,
    })
  }

  private loadAndRender(): void {
    const history = HistoryStorage.load()
    this.render(history)
    this.updateModeUI()
  }

  private render(history: HistoryItem[]): void {
    this.historyList.innerHTML = ''

    if (history.length === 0) {
      this.noHistoryMessage.style.display = 'block'
      this.historyList.appendChild(this.noHistoryMessage)
      return
    }

    this.noHistoryMessage.style.display = 'none'

    // Filter selectedForComparison to remove any items no longer in history
    if (this.currentMode === 'comparison') {
      const currentTimestamps = new Set(history.map((item) => item.timestamp))
      this.selectedForComparison = this.selectedForComparison.filter((item) =>
        currentTimestamps.has(item.timestamp)
      )
    }

    history.forEach((item) => {
      const card = this.createHistoryCard(item)
      this.historyList.appendChild(card)
    })
  }

  private createHistoryCard(item: HistoryItem): HTMLElement {
    const card = document.createElement('div')
    card.className = `history-card ${item.fadedColorClass || 'bg-fade-gray-400'}`

    // Add mode-specific classes and elements
    if (this.currentMode === 'deleting') {
      card.classList.add('deleting-mode')
    }

    // Add mode-specific elements on the left
    if (this.currentMode === 'comparison') {
      const checkbox = this.createComparisonCheckbox(item)
      card.appendChild(checkbox)
    }

    const summaryWrapper = document.createElement('div')
    summaryWrapper.className = 'history-summary-wrapper'

    const summary = document.createElement('div')
    summary.className = 'history-summary'
    summary.innerHTML = `
      <span class="font-medium text-sm truncate product-name-summary pr-2">${this.escapeHtml(item.productName || (item.isManual ? 'Manual Entry' : 'N/A'))}</span>
      <span class="text-xs font-semibold whitespace-nowrap">${item.proteinActualPercentage}% ${item.proteinLabel || ''}</span>
    `

    summary.onclick = () => {
      if (this.currentMode === 'normal') {
        card.classList.toggle('expanded')
      } else if (this.currentMode === 'comparison') {
        // Toggle checkbox when clicking summary in comparison mode
        const checkbox = card.querySelector('.comparison-checkbox') as HTMLInputElement
        if (checkbox) {
          checkbox.checked = !checkbox.checked
          checkbox.dispatchEvent(new Event('change'))
        }
      }
      // In delete mode, clicking doesn't expand
    }

    summaryWrapper.appendChild(summary)

    const details = document.createElement('div')
    details.className = 'history-details text-xs space-y-1'
    const unitLabel = item.isManual ? '/ serving' : '/ 100g'

    details.innerHTML = `
      <p class="history-item-name-details">${this.escapeHtml(item.productName || (item.isManual ? 'Manual Entry' : 'N/A'))}</p>
      <div class="flex items-center space-x-2">
        <strong class="font-medium text-gray-700 w-20 inline-block shrink-0">Protein %:</strong>
        <div class="percentage-bar-container flex-grow" style="height: 16px;">
          <div class="percentage-bar-fill ${item.colorClass || 'bg-gray-400'}" style="width: ${item.proteinDisplayPercentage}%; line-height: 16px; font-size: 0.65rem;">${item.proteinActualPercentage}%</div>
        </div>
        <span class="font-medium text-gray-600 w-14 text-right shrink-0">${item.proteinLabel}</span>
      </div>
      ${item.barcode ? `<p><strong class="font-medium text-gray-700 w-20 inline-block">Barcode:</strong><span class="text-gray-600 mr-1">${item.barcode}</span><a href="https://world.openfoodfacts.org/product/${item.barcode}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 hover:underline">[View]</a></p>` : ''}
      <p><strong class="font-medium text-gray-700 w-20 inline-block">Protein:</strong> <span class="text-gray-600">${item.proteinGrams || 'N/A'} ${unitLabel}</span></p>
      <p><strong class="font-medium text-gray-700 w-20 inline-block">Calories:</strong> <span class="text-gray-600">${item.energyKcal || 'N/A'} kcal ${unitLabel}</span></p>
      ${item.errorMessage ? `<p class="text-red-600"><strong class="font-medium text-gray-700 w-20 inline-block">Note:</strong> ${this.escapeHtml(item.errorMessage)}</p>` : ''}
    `

    summaryWrapper.appendChild(details)
    card.appendChild(summaryWrapper)

    // Add delete button on the right side
    if (this.currentMode === 'deleting') {
      const deleteBtn = this.createDeleteButton(item)
      card.appendChild(deleteBtn)
    }

    return card
  }

  private createComparisonCheckbox(item: HistoryItem): HTMLInputElement {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.classList.add(
      'comparison-checkbox',
      'form-checkbox',
      'h-5',
      'w-5',
      'text-indigo-600',
      'transition',
      'duration-150',
      'ease-in-out',
      'mr-3',
      'ml-2',
      'flex-shrink-0'
    )
    checkbox.setAttribute('data-timestamp', item.timestamp)

    // Check if this item is already selected
    checkbox.checked = this.selectedForComparison.some(
      (selectedItem) => selectedItem.timestamp === item.timestamp
    )

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        // Add item if not already present
        if (!this.selectedForComparison.some((sel) => sel.timestamp === item.timestamp)) {
          this.selectedForComparison.push(item)
        }
      } else {
        // Remove item
        this.selectedForComparison = this.selectedForComparison.filter(
          (sel) => sel.timestamp !== item.timestamp
        )
      }

      // Update button state and emit event
      this.generateComparisonBtn.disabled = this.selectedForComparison.length < 2
      this.eventBus.emit<ComparisonSelectionChangeEvent>(EVENTS.COMPARISON_SELECTION_CHANGE, {
        selectedItems: this.selectedForComparison,
      })
    })

    return checkbox
  }

  private createDeleteButton(item: HistoryItem): HTMLButtonElement {
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'delete-history-item-btn'
    deleteBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
    `
    deleteBtn.setAttribute('aria-label', 'Delete item')
    deleteBtn.onclick = (e) => {
      e.stopPropagation()
      this.deleteHistoryItem(item.timestamp)
    }
    return deleteBtn
  }

  private deleteHistoryItem(timestamp: string): void {
    HistoryStorage.remove(timestamp)

    // Remove from selected items if it was selected
    this.selectedForComparison = this.selectedForComparison.filter(
      (item) => item.timestamp !== timestamp
    )

    this.loadAndRender()
    this.eventBus.emit(EVENTS.HISTORY_UPDATED, {})
  }

  private clearAllHistory(): void {
    if (confirm('Are you sure you want to clear the entire history?')) {
      HistoryStorage.clear()
      this.selectedForComparison = []
      this.currentMode = 'normal'
      this.loadAndRender()
      this.eventBus.emit(EVENTS.HISTORY_UPDATED, {})
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  refresh(): void {
    this.loadAndRender()
  }

  getCurrentMode(): HistoryMode {
    return this.currentMode
  }

  getSelectedItems(): HistoryItem[] {
    return [...this.selectedForComparison]
  }
}
