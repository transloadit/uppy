const { iconFile, iconText, iconImage, iconAudio, iconVideo, iconPDF, iconArchive } = require('../components/icons')

module.exports = function getIconByMime (fileType) {
  const defaultChoice = {
    color: '#838999',
    icon: iconFile()
  }

  if (!fileType) return defaultChoice

  const fileTypeGeneral = fileType.split('/')[0]
  const fileTypeSpecific = fileType.split('/')[1]

  // Text
  if (fileTypeGeneral === 'text') {
    return {
      color: '#5a5e69',
      icon: iconText()
    }
  }

  // Image
  if (fileTypeGeneral === 'image') {
    return {
      color: '#686de0',
      icon: iconImage()
    }
  }

  // Audio
  if (fileTypeGeneral === 'audio') {
    return {
      color: '#068dbb',
      icon: iconAudio()
    }
  }

  // Video
  if (fileTypeGeneral === 'video') {
    return {
      color: '#19af67',
      icon: iconVideo()
    }
  }

  // PDF
  if (fileTypeGeneral === 'application' && fileTypeSpecific === 'pdf') {
    return {
      color: '#e25149',
      icon: iconPDF()
    }
  }

  // Archive
  const archiveTypes = ['zip', 'x-7z-compressed', 'x-rar-compressed', 'x-gtar', 'x-apple-diskimage', 'x-diskcopy']
  if (fileTypeGeneral === 'application' && archiveTypes.indexOf(fileTypeSpecific) !== -1) {
    return {
      color: '#00C469',
      icon: iconArchive()
    }
  }

  return defaultChoice
}
