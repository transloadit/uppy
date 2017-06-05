const { iconText, iconAudio, iconVideo, iconPDF } = require('./icons')

module.exports = function getIconByMime (fileTypeGeneral, fileTypeSpecific) {
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

  return {
    color: '#ccc',
    icon: ''
  }
}
