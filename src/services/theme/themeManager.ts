import { EventBus, EVENTS } from '@/utils/events'
import type { ThemeMode, ThemeChangeEvent } from '@/types'

/**
 * Theme management service
 * Handles theme state persistence and application
 */
export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: ThemeMode = 'system'
  private eventBus = EventBus.getInstance()
  private mediaQuery: MediaQueryList

  private constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.initialize()
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  private initialize(): void {
    // Load saved theme preference
    this.loadSavedTheme()

    // Listen for system theme changes
    this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this))

    // Apply initial theme
    this.applyTheme()
  }

  private loadSavedTheme(): void {
    try {
      const savedTheme = localStorage.getItem('theme') as ThemeMode
      if (savedTheme && ['system', 'light', 'dark'].includes(savedTheme)) {
        this.currentTheme = savedTheme
      }
    } catch (error) {
      console.warn('Failed to load saved theme:', error)
    }
  }

  private saveTheme(theme: ThemeMode): void {
    try {
      localStorage.setItem('theme', theme)
    } catch (error) {
      console.warn('Failed to save theme:', error)
    }
  }

  private handleSystemThemeChange(): void {
    if (this.currentTheme === 'system') {
      this.applyTheme()
    }
  }

  private applyTheme(): void {
    const root = document.documentElement
    const isDark = this.shouldUseDarkMode()

    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  private shouldUseDarkMode(): boolean {
    switch (this.currentTheme) {
      case 'dark':
        return true
      case 'light':
        return false
      case 'system':
        return this.mediaQuery.matches
      default:
        return false
    }
  }

  setTheme(theme: ThemeMode): void {
    const previousTheme = this.currentTheme
    this.currentTheme = theme
    this.saveTheme(theme)
    this.applyTheme()

    // Emit theme change event
    this.eventBus.emit<ThemeChangeEvent>(EVENTS.THEME_CHANGE, {
      theme,
      previousTheme,
    })
  }

  getTheme(): ThemeMode {
    return this.currentTheme
  }

  getCurrentEffectiveTheme(): 'light' | 'dark' {
    return this.shouldUseDarkMode() ? 'dark' : 'light'
  }

  cycleTheme(): void {
    const themes: ThemeMode[] = ['system', 'light', 'dark']
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    this.setTheme(themes[nextIndex])
  }
}
