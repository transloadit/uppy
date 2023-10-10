import toArray from '../../toArray.ts'

// .files fallback, should be implemented in any browser
export default function fallbackApi (dataTransfer) {
  const files = toArray(dataTransfer.files)
  return Promise.resolve(files)
}
