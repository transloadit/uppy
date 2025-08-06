import packageJson from '../package.json' with { type: 'json' }

export type GenericState = Record<string, unknown>

export type Listener<T> = (
  prevState: T,
  nextState: T,
  patch?: Partial<T>,
) => void

export interface Store<T extends GenericState> {
  getState: () => T

  setState(patch?: Partial<T>): void

  subscribe(listener: Listener<T>): () => void
}

/**
 * Default store that keeps state in a simple object.
 */
class DefaultStore<T extends GenericState = GenericState> implements Store<T> {
  static VERSION = packageJson.version

  public state: T = {} as T

  #callbacks = new Set<Listener<T>>()

  getState(): T {
    return this.state
  }

  setState(patch?: Partial<T>): void {
    const prevState = { ...this.state }
    const nextState = { ...this.state, ...patch }

    this.state = nextState
    this.#publish(prevState, nextState, patch)
  }

  subscribe(listener: Listener<T>): () => void {
    this.#callbacks.add(listener)
    return () => {
      this.#callbacks.delete(listener)
    }
  }

  #publish(...args: Parameters<Listener<T>>): void {
    this.#callbacks.forEach((listener) => {
      listener(...args)
    })
  }
}

export default DefaultStore
