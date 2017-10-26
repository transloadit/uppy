const { iconText, iconAudio, iconVideo, iconPDF } = require('./icons')

module.exports = function getIconByMime (fileType) {
  const defaultChoice = {
    color: '#cbcbcb',
    icon: ''
  }

  if (!fileType) return defaultChoice

  const fileTypeGeneral = fileType.split('/')[0]
  const fileTypeSpecific = fileType.split('/')[1]

  if (fileTypeGeneral === 'text') {
    return {
      color: '#000',
      icon: iconText()
    }
  }

  if (fileTypeGeneral === 'audio') {
    return {
      color: '#1abc9c',
      icon: iconAudio()
    }
  }

  if (fileTypeGeneral === 'video') {
    return {
      color: '#2980b9',
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
