import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Scanner } from './Scanner'
import { EVENTS } from '@/utils/events'

// Mock Html5Qrcode
const mockHtml5Qrcode = {
  start: vi.fn(),
  stop: vi.fn(),
  isScanning: false,
}

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn(() => mockHtml5Qrcode),
}))

// Mock DOM elements
const createMockElement = (id: string, tagName = 'div') => {
  const element = document.createElement(tagName)
  element.id = id

  // Mock classList methods
  const classListMock = {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn(),
  }

  Object.defineProperty(element, 'classList', {
    value: classListMock,
    writable: true,
  })

  return element
}

describe('Scanner', () => {
  let scanner: Scanner
  let readerElement: HTMLElement
  let scanButton: HTMLButtonElement
  let stopButton: HTMLButtonElement
  let statusElement: HTMLElement

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    mockHtml5Qrcode.isScanning = false

    // Create mock DOM elements
    readerElement = createMockElement('reader')
    scanButton = createMockElement('scan-btn', 'button') as HTMLButtonElement
    stopButton = createMockElement('stop-btn', 'button') as HTMLButtonElement
    statusElement = createMockElement('status')

    // Add elements to DOM
    document.body.appendChild(readerElement)
    document.body.appendChild(scanButton)
    document.body.appendChild(stopButton)
    document.body.appendChild(statusElement)

    // Mock getElementById
    vi.spyOn(document, 'getElementById').mockImplementation((id) => {
      switch (id) {
        case 'reader':
          return readerElement
        case 'scan-btn':
          return scanButton
        case 'stop-btn':
          return stopButton
        case 'status':
          return statusElement
        default:
          return null
      }
    })

    scanner = new Scanner('reader', 'scan-btn', 'stop-btn', 'status')
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('initializes with DOM elements', () => {
      expect(document.getElementById).toHaveBeenCalledWith('reader')
      expect(document.getElementById).toHaveBeenCalledWith('scan-btn')
      expect(document.getElementById).toHaveBeenCalledWith('stop-btn')
      expect(document.getElementById).toHaveBeenCalledWith('status')
    })

    it('throws error for missing elements', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      expect(() => {
        new Scanner('missing', 'scan-btn', 'stop-btn', 'status')
      }).toThrow('Element with id "missing" not found')
    })

    it('sets initial inactive state', () => {
      expect((readerElement.classList as any).add).toHaveBeenCalledWith('inactive')
      expect((scanButton.classList as any).toggle).toHaveBeenCalledWith('hidden', false)
      expect((stopButton.classList as any).toggle).toHaveBeenCalledWith('hidden', true)
    })
  })

  describe('startScanning', () => {
    it('starts scanning successfully', async () => {
      mockHtml5Qrcode.start.mockResolvedValue(undefined)

      await scanner.startScanning()

      expect(mockHtml5Qrcode.start).toHaveBeenCalledWith(
        { facingMode: 'environment' },
        expect.objectContaining({
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
        }),
        expect.any(Function),
        expect.any(Function)
      )

      expect(scanner.isCurrentlyScanning()).toBe(true)
      expect(statusElement.textContent).toBe('Scanning... Point camera at a barcode.')
    })

    it('handles scanning errors', async () => {
      const error = new Error('Camera permission denied')
      mockHtml5Qrcode.start.mockRejectedValue(error)

      await scanner.startScanning()

      expect(scanner.isCurrentlyScanning()).toBe(false)
      expect(statusElement.textContent).toContain('Error starting scanner')
      expect(statusElement.textContent).toContain('Camera permission denied')
    })

    it('does not start if already scanning', async () => {
      mockHtml5Qrcode.start.mockResolvedValue(undefined)

      await scanner.startScanning()
      mockHtml5Qrcode.start.mockClear()

      await scanner.startScanning()

      expect(mockHtml5Qrcode.start).not.toHaveBeenCalled()
    })
  })

  describe('stopScanning', () => {
    beforeEach(async () => {
      mockHtml5Qrcode.start.mockResolvedValue(undefined)
      mockHtml5Qrcode.stop.mockResolvedValue(undefined)
      await scanner.startScanning()
      mockHtml5Qrcode.isScanning = true
    })

    it('stops scanning successfully', async () => {
      scanner.stopScanning()

      expect(scanner.isCurrentlyScanning()).toBe(false)
      expect((readerElement.classList as any).add).toHaveBeenCalledWith('inactive')
      expect(statusElement.textContent).toBe('Scanner stopped.')
    })

    it('handles stop errors gracefully', async () => {
      mockHtml5Qrcode.stop.mockRejectedValue(new Error('Stop failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      scanner.stopScanning()

      await new Promise((resolve) => setTimeout(resolve, 10)) // Wait for promise

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error stopping scanner via library')
      )

      consoleSpy.mockRestore()
    })

    it('does not call stop if not scanning', () => {
      scanner.stopScanning() // Stop first time
      mockHtml5Qrcode.stop.mockClear()

      scanner.stopScanning() // Stop again

      expect(mockHtml5Qrcode.stop).not.toHaveBeenCalled()
    })
  })

  describe('barcode detection', () => {
    it('emits barcode scanned event for new barcode', async () => {
      let capturedCallback: ((barcode: string) => void) | null = null

      mockHtml5Qrcode.start.mockImplementation((device, config, successCallback) => {
        capturedCallback = successCallback
        return Promise.resolve()
      })

      const eventSpy = vi.fn()
      const eventBus = (scanner as any).eventBus
      eventBus.on(EVENTS.BARCODE_SCANNED, eventSpy)

      await scanner.startScanning()

      // Now trigger the callback after scanning has started
      if (capturedCallback) {
        capturedCallback('1234567890')
      }

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { barcode: '1234567890' },
        })
      )
      expect(statusElement.textContent).toContain('Barcode detected: 1234567890')
    })

    it('ignores duplicate consecutive barcodes', async () => {
      let capturedCallback: ((barcode: string) => void) | null = null

      mockHtml5Qrcode.start.mockImplementation((device, config, successCallback) => {
        capturedCallback = successCallback
        return Promise.resolve()
      })

      const eventSpy = vi.fn()
      const eventBus = (scanner as any).eventBus
      eventBus.on(EVENTS.BARCODE_SCANNED, eventSpy)

      await scanner.startScanning()

      if (capturedCallback) {
        capturedCallback('1234567890')
        capturedCallback('1234567890') // Same barcode
      }

      expect(eventSpy).toHaveBeenCalledTimes(1)
    })

    it('allows different barcodes', async () => {
      let capturedCallback: ((barcode: string) => void) | null = null

      mockHtml5Qrcode.start.mockImplementation((device, config, successCallback) => {
        capturedCallback = successCallback
        return Promise.resolve()
      })

      const eventSpy = vi.fn()
      const eventBus = (scanner as any).eventBus
      eventBus.on(EVENTS.BARCODE_SCANNED, eventSpy)

      await scanner.startScanning()

      if (capturedCallback) {
        capturedCallback('1234567890')
        capturedCallback('0987654321') // Different barcode
      }

      expect(eventSpy).toHaveBeenCalledTimes(2)
      expect(eventSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ detail: { barcode: '1234567890' } })
      )
      expect(eventSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ detail: { barcode: '0987654321' } })
      )
    })
  })

  describe('event listeners', () => {
    it('sets up button click listeners', () => {
      const scanSpy = vi.spyOn(scanner, 'startScanning')
      const stopSpy = vi.spyOn(scanner, 'stopScanning')

      scanButton.click()
      stopButton.click()

      expect(scanSpy).toHaveBeenCalled()
      expect(stopSpy).toHaveBeenCalled()
    })
  })

  describe('public API', () => {
    it('returns scanning state', () => {
      expect(scanner.isCurrentlyScanning()).toBe(false)
    })

    it('returns last scanned barcode', () => {
      expect(scanner.getLastScannedBarcode()).toBeNull()
    })

    it('cleans up on destroy', () => {
      const stopSpy = vi.spyOn(scanner, 'stopScanning')

      scanner.destroy()

      expect(stopSpy).toHaveBeenCalled()
    })
  })
})
