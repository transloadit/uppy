/**
 * Low-pass filter using Exponential Moving Averages (aka exponential smoothing)
 * Filters a sequence of values by updating the mixing the previous output value
 * with the new input using the exponential window function
 *
 * @param newValue the n-th value of the sequence
 * @param previousSmoothedValue the exponential average of the first n-1 values
 * @param halfLife value of `dt` to move the smoothed value halfway between `previousFilteredValue` and `newValue`
 * @param dt time elapsed between adding the (n-1)th and the n-th values
 * @returns the exponential average of the first n values
 */
export default function emaFilter(
  newValue: number,
  previousSmoothedValue: number,
  halfLife: number,
  dt: number,
): number {
  if (halfLife === 0 || newValue === previousSmoothedValue) return newValue
  if (dt === 0) return previousSmoothedValue

  return newValue + (previousSmoothedValue - newValue) * 2 ** (-dt / halfLife)
}
