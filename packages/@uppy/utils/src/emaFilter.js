export default function emaFilter (newValue, previousFilteredValue, halfLife, dt) {
  if (halfLife === 0 || newValue === previousFilteredValue) return newValue
  if (dt === 0) return previousFilteredValue

  const k = 2 ** (-1 / halfLife)
  return newValue + (previousFilteredValue - newValue) * (k ** dt)
}
