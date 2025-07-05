export const SCANNER_CONFIG = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  aspectRatio: 1.0,
  rememberLastUsedCamera: true,
} as const

export const CSS_CLASSES = {
  // Scanner states
  SCANNER_INACTIVE: 'inactive',
  SCANNER_ACTIVE: 'active',

  // Button states
  HIDDEN: 'hidden',

  // Protein color classes
  PROTEIN_COLORS: {
    'bg-gray-400': '#9ca3af',
    'bg-gray-500': '#6b7280',
    'bg-gray-700': '#374151',
    'bg-red-500': '#ef4444',
    'bg-yellow-500': '#eab308',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
    'bg-purple-600': '#9333ea',
  },
} as const

export const STORAGE_KEYS = {
  HISTORY: 'proteinMeterHistory',
} as const

export const UI_MESSAGES = {
  SCANNER_STARTING: 'Starting scanner...',
  SCANNER_SCANNING: 'Scanning... Point camera at a barcode.',
  SCANNER_STOPPED: 'Scanner stopped.',
  SCANNER_ERROR: 'Error starting scanner',
  BARCODE_DETECTED: (barcode: string) => `Barcode detected: ${barcode}. Fetching data...`,
  PERMISSION_ERROR: 'Check permissions & HTTPS.',
} as const
