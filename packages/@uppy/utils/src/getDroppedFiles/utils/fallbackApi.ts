import toArray from '../../toArray.js'

// .files fallback, should be implemented in any browser
export default function fallbackApi(
  dataTransfer: DataTransfer,
): Promise<File[]> {
  const files = toArray(dataTransfer.files)
  return Promise.resolve(files)
}
