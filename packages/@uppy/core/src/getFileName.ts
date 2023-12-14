export default function getFileName(
  fileType: string,
  fileDescriptor: { name?: string },
): string {
  if (fileDescriptor.name) {
    return fileDescriptor.name
  }

  if (fileType.split('/')[0] === 'image') {
    return `${fileType.split('/')[0]}.${fileType.split('/')[1]}`
  }

  return 'noname'
}
