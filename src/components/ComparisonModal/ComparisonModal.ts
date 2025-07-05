import type { HistoryItem } from '@/types'
import { ProteinCalculator } from '@/services/calculator/proteinCalculator'
import { EventBus } from '@/utils/events'

export class ComparisonModal {
  private eventBus = EventBus.getInstance()

  // DOM elements
  private modal: HTMLElement
  private canvasContainer: HTMLElement
  private downloadBtn: HTMLButtonElement
  private closeBtn: HTMLButtonElement

  // Current canvas for download
  private currentCanvas: HTMLCanvasElement | null = null

  constructor(
    modalId: string,
    canvasContainerId: string,
    downloadBtnId: string,
    closeBtnId: string
  ) {
    this.modal = this.getElementById(modalId)
    this.canvasContainer = this.getElementById(canvasContainerId)
    this.downloadBtn = this.getElementById(downloadBtnId) as HTMLButtonElement
    this.closeBtn = this.getElementById(closeBtnId) as HTMLButtonElement

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
  }

  private setupEventListeners(): void {
    // Listen for generate comparison events
    this.eventBus.on('generate-comparison', (event: CustomEvent<{ items: HistoryItem[] }>) => {
      this.generateComparisonImage(event.detail.items)
    })

    // Close button
    this.closeBtn.addEventListener('click', () => {
      this.hide()
    })

    // Download button
    this.downloadBtn.addEventListener('click', () => {
      this.downloadImage()
    })

    // Close on backdrop click
    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal) {
        this.hide()
      }
    })

    // Close on Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.hide()
      }
    })
  }

  private show(): void {
    this.modal.classList.remove('hidden')
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  }

  private hide(): void {
    this.modal.classList.add('hidden')
    document.body.style.overflow = '' // Restore scrolling
    this.currentCanvas = null
  }

  async generateComparisonImage(items: HistoryItem[]): Promise<void> {
    if (!items || items.length < 2) {
      alert('Please select at least two items to compare.')
      return
    }

    // Show modal and loading message
    this.canvasContainer.innerHTML =
      '<p class="text-center p-4">Generating image, please wait...</p>'
    this.show()
    this.downloadBtn.disabled = true

    try {
      const canvas = await this.createComparisonCanvas(items)
      this.currentCanvas = canvas

      // Replace loading message with canvas
      this.canvasContainer.innerHTML = ''
      this.canvasContainer.appendChild(canvas)
      this.downloadBtn.disabled = false
    } catch (error) {
      console.error('Error generating comparison image:', error)
      this.canvasContainer.innerHTML = `<p class="text-center text-red-500 p-4">Error generating image: ${(error as Error).message}. Please try again.</p>`
      this.downloadBtn.disabled = true
    }
  }

  private async createComparisonCanvas(items: HistoryItem[]): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas 2D context')
    }

    const scaleFactor = 2 // For high DPI displays
    const numItems = items.length

    // Base dimensions (will be multiplied by scaleFactor)
    const baseRowHeight = 60
    const basePaddingVertical = 15
    const basePaddingHorizontal = 20
    const baseProductNameLeftMargin = 10
    const baseProductNameMaxWidth = 250
    const baseBarStartX = baseProductNameLeftMargin + baseProductNameMaxWidth + 30
    const baseBarHeight = 25
    const baseBarMaxLength = 300
    const basePercentageTextWidth = 100

    // Calculate canvas dimensions
    const baseCanvasWidth =
      baseBarStartX +
      baseBarMaxLength +
      basePercentageTextWidth +
      basePaddingHorizontal +
      baseProductNameLeftMargin

    canvas.width = baseCanvasWidth * scaleFactor
    canvas.height = (numItems * baseRowHeight + (numItems + 1) * basePaddingVertical) * scaleFactor

    // Scale up dimensions for drawing
    const rowHeight = baseRowHeight * scaleFactor
    const paddingVertical = basePaddingVertical * scaleFactor
    const paddingHorizontal = basePaddingHorizontal * scaleFactor
    const productNameLeftMargin = baseProductNameLeftMargin * scaleFactor
    const productNameMaxWidth = baseProductNameMaxWidth * scaleFactor
    const barStartX = baseBarStartX * scaleFactor
    const barHeight = baseBarHeight * scaleFactor
    const barMaxLength = baseBarMaxLength * scaleFactor

    // Background
    ctx.fillStyle = '#f7f7f7'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Color mapping for protein categories
    const colorMap: Record<string, string> = {
      'bg-red-500': '#ef4444',
      'bg-yellow-500': '#eab308',
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-purple-600': '#9333ea',
      'bg-gray-500': '#6b7280',
      'bg-gray-700': '#374151',
      'bg-gray-400': '#9ca3af',
    }

    let currentY = paddingVertical

    for (let i = 0; i < numItems; i++) {
      const item = items[i]
      const itemRowStartY = currentY

      // Product Name
      ctx.fillStyle = '#333333'
      ctx.font = `bold ${15 * scaleFactor}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      const productName = item.productName || (item.isManual ? 'Manual Entry' : 'N/A')
      let displayName = productName
      let nameMetrics = ctx.measureText(displayName)

      // Truncate name if too long
      while (nameMetrics.width > productNameMaxWidth && displayName.length > 10) {
        displayName = displayName.substring(0, displayName.length - 4) + '...'
        nameMetrics = ctx.measureText(displayName)
      }

      const productNameY = itemRowStartY + 5 * scaleFactor
      ctx.fillText(displayName, paddingHorizontal + productNameLeftMargin, productNameY)

      // Protein Percentage Bar
      const proteinPercentage = parseFloat(item.proteinActualPercentage.toString()) || 0
      const proteinInfo = ProteinCalculator.getProteinInfo(proteinPercentage)

      const barFillWidth =
        ((parseFloat(item.proteinDisplayPercentage.toString()) || 0) / 100) * barMaxLength
      const barActualY = itemRowStartY + (rowHeight - barHeight) / 2
      const barFillColor = colorMap[proteinInfo.colorClass] || '#6b7280'
      const barCornerRadius = Math.min(5 * scaleFactor, barHeight / 2)

      const effectiveBarFillWidth = Math.max(0, barFillWidth)
      const effectiveBarHeight = Math.max(0, barHeight)

      if (effectiveBarFillWidth > 0 && effectiveBarHeight > 0) {
        this.drawRoundedRect(
          ctx,
          barStartX,
          barActualY,
          effectiveBarFillWidth,
          effectiveBarHeight,
          barCornerRadius,
          barFillColor
        )
      }

      // Percentage Text
      const percentageText = `${item.proteinActualPercentage}% ${proteinInfo.label}`
      ctx.fillStyle = '#333333'
      ctx.font = `normal ${12 * scaleFactor}px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        percentageText,
        barStartX + barMaxLength + 15 * scaleFactor,
        itemRowStartY + rowHeight / 2
      )

      // Row separator (except for last item)
      if (i < numItems - 1) {
        ctx.beginPath()
        ctx.strokeStyle = '#dddddd'
        ctx.lineWidth = 1 * scaleFactor
        const lineY = itemRowStartY + rowHeight + paddingVertical / 2
        ctx.moveTo(paddingHorizontal, lineY)
        ctx.lineTo(canvas.width - paddingHorizontal, lineY)
        ctx.stroke()
      }

      currentY += rowHeight + paddingVertical
    }

    return canvas
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: string
  ): void {
    if (width < 2 * radius) radius = width / 2
    if (height < 2 * radius) radius = height / 2
    if (radius < 0) radius = 0
    if (width <= 0 || height <= 0) return

    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + width, y, x + width, y + height, radius)
    ctx.arcTo(x + width, y + height, x, y + height, radius)
    ctx.arcTo(x, y + height, x, y, radius)
    ctx.arcTo(x, y, x + width, y, radius)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  private downloadImage(): void {
    if (!this.currentCanvas) {
      console.error('No canvas available for download')
      alert('Error: No image available to download.')
      return
    }

    try {
      const dataURL = this.currentCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = dataURL
      link.download = 'food_comparison.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Error downloading image. Please try again.')
    }
  }

  isVisible(): boolean {
    return !this.modal.classList.contains('hidden')
  }
}
