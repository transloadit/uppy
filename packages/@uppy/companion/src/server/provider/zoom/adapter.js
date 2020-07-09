const qs = require('qs')
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
  M4A: 'audio',
  CHAT: 'text',
  TRANSCRIPT: 'text',
  CC: 'text',
  FOLDER: 'folder'
}

exports.getDateName = (start, end) => {
  return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')}`
}

exports.getDateFolderId = (start, end) => {
  return `dates=${start.format('YYYY-MM-DD')}_${end.format('YYYY-MM-DD')}`
}

exports.getDateFolderRequestPath = (start, end) => {
  return `?from=${start.format('YYYY-MM-DD')}&to=${end.format('YYYY-MM-DD')}`
}

exports.getDateFolderModified = (end) => {
  return end.format('YYYY-MM-DD')
}

exports.getDateQuery = (start) => {
  return `?${qs.stringify({ cursor: start.subtract(1, 'days').format('YYYY-MM-DD') })}`
}

exports.getQuery = (results) => {
  if (results.next_page_token) {
    return `?${qs.stringify({
      cursor: results.next_page_token || '',
      from: results.from,
      to: results.to
    })}`
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
    return null
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
  let id = `${encodeURIComponent(item.id)}`
  if (item.file_type) {
    id = `${item.meeting_id}?recordingId=${id}`
  }
  return id
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
  return item.start_time
}

exports.getSize = (item) => {
  return item.file_size
}

exports.getCustomFields = (item) => {
  return {
    recordTrueId: item.id,
    requestDownloadUrl: item.download_url,
    recordingDate: item.recording_start
  }
}
