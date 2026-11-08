export type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | Record<string, unknown>
  | ClassValue[]

/**
 * Join class names, skipping falsy values. Arrays are flattened, and object
 * keys are included when their value is truthy:
 * `classNames('a', ['b'], { c: true, d: false })` is `'a b c'`.
 */
export default function classNames(...args: ClassValue[]): string {
  const classes: string[] = []
  for (const arg of args) {
    if (!arg) continue
    if (typeof arg === 'string' || typeof arg === 'number') {
      classes.push(String(arg))
    } else if (Array.isArray(arg)) {
      const inner = classNames(...arg)
      if (inner) classes.push(inner)
    } else {
      for (const [key, value] of Object.entries(arg))
        if (value) classes.push(key)
    }
  }
  return classes.join(' ')
}
