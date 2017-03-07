
declare function requestIdleCallback(callback: (timeRemaining: number, didTimeout: boolean) => void, options?: {timeout?: number}): number
declare function cancelIdleCallback(id: number): void