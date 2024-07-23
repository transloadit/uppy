export default function getFilePlugins(fileDescriptor: {
  plugins?: string[]
}): string[] {
  return fileDescriptor.plugins || []
}
