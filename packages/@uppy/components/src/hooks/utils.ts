export class Subscribers {
  private subscribers: Set<() => void> = new Set()

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
