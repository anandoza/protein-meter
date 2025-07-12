export const ANIMATION_TIMINGS = {
  FORM_TRANSITION: 300,
  SCANNER_TRANSITION: 300,
} as const

export const AnimationUtils = {
  delay: (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms)),
    
  waitForTransition: (element: HTMLElement, property: string): Promise<void> => 
    new Promise(resolve => {
      const handler = (e: TransitionEvent) => {
        if (e.target === element && e.propertyName === property) {
          element.removeEventListener('transitionend', handler)
          resolve()
        }
      }
      element.addEventListener('transitionend', handler)
    })
}