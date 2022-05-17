export default function getFileName (fileType, fileDescriptor) {
  if (fileDescriptor.name) {
    return fileDescriptor.name
  }

  if (fileType.split('/')[0] === 'image') {
    return `${fileType.split('/')[0]}.${fileType.split('/')[1]}`
  }

  return 'noname'
}
