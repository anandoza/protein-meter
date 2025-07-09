import { EventBus, EVENTS } from '@/utils/events'
import { ThemeManager } from '@/services/theme/themeManager'
import { createElement, Sun, Moon, SunMoon } from 'lucide'
import type { ThemeChangeEvent } from '@/types'

/**
 * Theme toggle component
 * Provides a 3-state toggle (system → light → dark)
 */
export class ThemeToggle {
  private container: HTMLElement
  private themeManager: ThemeManager
  private eventBus = EventBus.getInstance()
  private button: HTMLButtonElement | null = null

  constructor(container: HTMLElement) {
    this.container = container
    this.themeManager = ThemeManager.getInstance()
    this.createToggleButton()
    this.setupEventListeners()
  }

  private createToggleButton(): void {
    this.button = document.createElement('button')
    this.button.id = 'theme-toggle-btn'
    this.button.className =
      'bg-secondary hover:bg-accent text-secondary-foreground font-medium py-2 px-3 rounded-full transition duration-300 ease-in-out shadow hover:shadow-md flex items-center justify-center gap-2 text-sm'
    this.button.setAttribute('aria-label', 'Toggle theme')
    this.button.setAttribute('title', 'Toggle theme')

    this.updateButtonContent()
    this.container.appendChild(this.button)
  }

  private updateButtonContent(): void {
    if (!this.button) return

    const theme = this.themeManager.getTheme()

    let iconElement: SVGElement
    let text: string

    switch (theme) {
      case 'system':
        iconElement = createElement(SunMoon, { size: 16, 'stroke-width': 2 })
        text = 'Auto'
        break
      case 'light':
        iconElement = createElement(Sun, { size: 16, 'stroke-width': 2 })
        text = 'Light'
        break
      case 'dark':
        iconElement = createElement(Moon, { size: 16, 'stroke-width': 2 })
        text = 'Dark'
        break
      default:
        iconElement = createElement(Sun, { size: 16, 'stroke-width': 2 })
        text = 'Light'
    }

    iconElement.setAttribute('class', 'flex-shrink-0')

    this.button.innerHTML = ''
    this.button.appendChild(iconElement)

    const textSpan = document.createElement('span')
    textSpan.className = 'hidden sm:inline'
    textSpan.textContent = text
    this.button.appendChild(textSpan)
  }

  private setupEventListeners(): void {
    if (!this.button) return

    this.button.addEventListener('click', this.handleToggleClick.bind(this))

    // Listen for theme changes from other sources
    this.eventBus.on<ThemeChangeEvent>(EVENTS.THEME_CHANGE, this.handleThemeChange.bind(this))
  }

  private handleToggleClick(): void {
    this.themeManager.cycleTheme()
  }

  private handleThemeChange(): void {
    this.updateButtonContent()
  }

  show(): void {
    if (this.button) {
      this.button.classList.remove('hidden')
    }
  }

  hide(): void {
    if (this.button) {
      this.button.classList.add('hidden')
    }
  }
}
