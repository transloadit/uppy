const { iconFile, iconText, iconImage, iconAudio, iconVideo, iconPDF, iconArchive } = require('../components/icons')

module.exports = function getIconByMime (fileType) {
  const defaultChoice = {
    color: '#838999',
    icon: iconFile()
  }

  if (!fileType) return defaultChoice

  const fileTypeGeneral = fileType.split('/')[0]
  const fileTypeSpecific = fileType.split('/')[1]

  if (fileTypeGeneral === 'text') {
    return {
      color: '#5a5e69',
      icon: iconText()
    }
  }

  if (fileTypeGeneral === 'image') {
    return {
      color: '#686de0',
      icon: iconImage()
    }
  }

  if (fileTypeGeneral === 'audio') {
    return {
      color: '#068dbb',
      icon: iconAudio()
    }
  }

  if (fileTypeGeneral === 'video') {
    return {
      color: '#19af67',
      icon: iconVideo()
    }
  }

  if (fileTypeGeneral === 'application' && fileTypeSpecific === 'pdf') {
    return {
      color: '#e25149',
      icon: iconPDF()
    }
  }

  if (fileTypeGeneral === 'application' && (
    fileTypeSpecific === 'zip' ||
    fileTypeSpecific === 'x-7z-compressed' ||
    fileTypeSpecific === 'x-rar-compressed' ||
    fileTypeSpecific === 'x-gtar' ||
    fileTypeSpecific === 'x-apple-diskimage')
  ) {
    return {
      color: '#00C469',
      icon: iconArchive()
    }
  }

  if (fileTypeGeneral === 'image') {
    return {
      color: '#f2f2f2',
      icon: ''
    }
  }

  return defaultChoice
}
