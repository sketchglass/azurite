
declare function requestIdleCallback(callback: (timeRemaining: number, didTimeout: boolean) => void, options?: {timeout?: number}): number
declare function cancelIdleCallback(id: number): void

declare namespace Electron {
  interface Menu {
    popup(browserWindow?: BrowserWindow, options?: {
      x?: number
      y?: number
      async?: boolean
      positioningItem?: number
    }): void
  }
}
