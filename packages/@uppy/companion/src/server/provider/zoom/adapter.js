const moment = require('moment')

const MIMETYPES = {
  MP4: 'video/mp4',
  M4A: 'audio/mp4',
  CHAT: 'text/plain',
  TRANSCRIPT: 'text/vtt',
  CC: 'text/vtt',
  TIMELINE: 'application/json'
}
const ICONS = {
  MP4: 'video',
  M4A: 'file',
  CHAT: 'file',
  TRANSCRIPT: 'file',
  CC: 'file',
  FOLDER: 'folder',
  TIMELINE: 'file'
}

exports.getDateName = (start, end) => {
  return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')}`
}

exports.getAccountCreationDate = (results) => {
  return moment(results.created_at)
}

exports.getUserEmail = (results) => {
  return results.email
}

exports.getDateFolderId = (start, end) => {
  return `${start.format('YYYY-MM-DD')}_${end.format('YYYY-MM-DD')}`
}

exports.getDateFolderRequestPath = (start, end) => {
  return `?from=${start.format('YYYY-MM-DD')}&to=${end.format('YYYY-MM-DD')}`
}

exports.getDateFolderModified = (end) => {
  return end.format('YYYY-MM-DD')
}

exports.getDateNextPagePath = (start) => {
  return `?cursor=${start.subtract(1, 'days').format('YYYY-MM-DD')}`
}

exports.getNextPagePath = (results) => {
  if (results.next_page_token) {
    return `?cursor=${results.next_page_token}&from=${results.from}&to=${results.to}`
  }
  return null
}
// we rely on the file_type attribute to differentiate a recording file from other items
exports.getIsFolder = (item) => {
  return !item.file_type
}

exports.getItemName = (item) => {
  const start = moment(item.start_time || item.recording_start)
    .clone()
    .format('YYYY-MM-DD, kk:mm')

  if (item.file_type) {
    const itemType = item.recording_type ? ` - ${item.recording_type.split('_').join(' ')}` : ''
    return `${start}${itemType} (${item.file_type.toLowerCase()})`
  }

  return `${item.topic} (${start})`
}

exports.getIcon = (item) => {
  if (item.file_type) {
    return ICONS[item.file_type]
  }
  return ICONS.FOLDER
}

exports.getMimeType = (item) => {
  if (item.file_type) {
    return MIMETYPES[item.file_type]
  }
  return null
}

exports.getId = (item) => {
  if (item.file_type && item.file_type === 'TIMELINE') {
    return `${encodeURIComponent(item.meeting_id)}__TIMELINE`
  } else if (item.file_type) {
    return `${encodeURIComponent(item.meeting_id)}__${encodeURIComponent(item.id)}`
  }
  return `${encodeURIComponent(item.id)}`
}

exports.getRequestPath = (item) => {
  if (item.file_type && item.file_type === 'TIMELINE') {
    return `${encodeURIComponent(item.meeting_id)}?recordingId=TIMELINE`
  } else if (item.file_type) {
    return `${encodeURIComponent(item.meeting_id)}?recordingId=${encodeURIComponent(item.id)}`
  }
  return `${encodeURIComponent(item.id)}`
}

exports.getStartDate = (item) => {
  if (item.file_type === 'TIMELINE') {
    return item.recording_start
  }
  return item.start_time
}

exports.getSize = (item) => {
  if (item.file_type && item.file_type === 'TIMELINE') {
    const maxExportFileSize = 1024 * 1024
    return maxExportFileSize
  } else if (item.file_type) {
    return item.file_size
  }
  return item.total_size
}
