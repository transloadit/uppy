type Listener = ((...args: any[]) => void) & {
  event?: string
  /** On a `once` wrapper: the listener it wraps, so `off` can match it. */
  fn?: Listener
}

/**
 * Event emitter with the semantics of namespace-emitter 2.0.1 (MIT), which
 * Uppy's `on`/`once`/`off`/`emit` have always had:
 * - listeners for `'ns'` also fire for `'ns:event'` (first segment only);
 * - listeners for `'*'` fire for every event;
 * - listeners are called with `this` set to themselves, `listener.event` set
 *   to the name of the event being emitted, and exactly six arguments;
 * - `off(event)` without a listener removes all listeners for that event.
 *
 * Four differences, all fixes:
 * - `off(event, fn)` also removes a listener added with `once(event, fn)`;
 * - a `'*'` listener fires for a namespaced event even when it was registered
 *   after a listener for that namespace;
 * - `emit('*')` calls `'*'` listeners once, not twice;
 * - any string is a valid event name, including `'constructor'` and other
 *   names of `Object.prototype` members.
 */
export default function createEmitter() {
  const fns = new Map<string, Listener[]>()

  const emitter = {
    on(event: string, fn: Listener): void {
      const listeners = fns.get(event)
      if (listeners) listeners.push(fn)
      else fns.set(event, [fn])
    },

    once(event: string, fn: Listener): void {
      const one: Listener = function (this: unknown, ...args: unknown[]) {
        fn.apply(this, args)
        emitter.off(event, one)
      }
      one.fn = fn
      emitter.on(event, one)
    },

    off(event: string, fn?: Listener): void {
      const keep =
        event && fn
          ? // `f?.`: nothing stops a JavaScript caller from registering a
            // non-function, and removing another listener must not throw.
            (fns.get(event) ?? []).filter((f) => f !== fn && f?.fn !== fn)
          : []
      if (keep.length) fns.set(event, keep)
      else fns.delete(event)
    },

    emit(event: string, ...args: unknown[]): void {
      let listeners = fns.get(event) ?? []
      const idx = event.indexOf(':')
      const namespace = idx === -1 ? undefined : event.slice(0, idx)
      for (const [key, list] of fns) {
        if ((key === '*' && event !== '*') || key === namespace) {
          listeners = listeners.concat(list)
        }
      }
      // Listeners always get exactly six arguments, as with namespace-emitter.
      args.length = 6
      // Iterate over a snapshot: a listener added during this emit must not
      // run until the next one.
      for (const fn of listeners.slice()) {
        if (!fn) break
        fn.event = event
        fn.apply(fn, args)
      }
    },
  }

  return emitter
}
