// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore We don't want TS to generate types for the package.json
import packageJson from '../package.json'

export type StateOrStateFragment = Record<string, unknown>

export type Listener = (
  prevState: StateOrStateFragment,
  nextState: StateOrStateFragment,
  patch: StateOrStateFragment,
) => void

/**
 * Default store that keeps state in a simple object.
 */
class DefaultStore {
  static VERSION = packageJson.version

  public state: StateOrStateFragment

  #callbacks = new Set<Listener>()

  constructor() {
    this.state = {}
  }

  getState(): StateOrStateFragment {
    return this.state
  }

  setState(patch: StateOrStateFragment): void {
    const prevState = { ...this.state }
    const nextState = { ...this.state, ...patch }

    this.state = nextState
    this.#publish(prevState, nextState, patch)
  }

  subscribe(listener: Listener): () => void {
    this.#callbacks.add(listener)
    return () => {
      this.#callbacks.delete(listener)
    }
  }

  #publish(...args: Parameters<Listener>): void {
    this.#callbacks.forEach((listener) => {
      listener(...args)
    })
  }
}

export default DefaultStore
