// .files fallback, should be implemented in any browser
export default function fallbackApi(
  dataTransfer: DataTransfer,
): Promise<File[]> {
  const files = Array.from(dataTransfer.files)
  return Promise.resolve(files)
}
