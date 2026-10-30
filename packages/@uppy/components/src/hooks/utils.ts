export class Subscribers {
  private subscribers: Set<() => void> = new Set()

  get size(): number {
    return this.subscribers.size
  }

  add = (listener: () => void): (() => void) => {
    this.subscribers.add(listener)
    return () => this.subscribers.delete(listener)
  }

  emit = (): void => {
    for (const listener of this.subscribers) {
      listener()
    }
  }

  clear = (): void => {
    this.subscribers.clear()
  }
}
