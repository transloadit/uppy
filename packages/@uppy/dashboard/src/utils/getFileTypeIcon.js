const { iconFile, iconText, iconAudio, iconVideo, iconPDF } = require('../components/icons')

module.exports = function getIconByMime (fileType) {
  const defaultChoice = {
    color: '#babcbe',
    icon: iconFile()
  }

  if (!fileType) return defaultChoice

  const fileTypeGeneral = fileType.split('/')[0]
  const fileTypeSpecific = fileType.split('/')[1]

  if (fileTypeGeneral === 'text') {
    return {
      color: '#babcbe',
      icon: iconText()
    }
  }

  if (fileTypeGeneral === 'audio') {
    return {
      color: '#049bcf',
      icon: iconAudio()
    }
  }

  if (fileTypeGeneral === 'video') {
    return {
      color: '#6829ca',
      icon: iconVideo()
    }
  }

  if (fileTypeGeneral === 'application' && fileTypeSpecific === 'pdf') {
    return {
      color: '#e74c3c',
      icon: iconPDF()
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
