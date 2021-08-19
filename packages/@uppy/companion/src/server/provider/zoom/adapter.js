const moment = require('moment-timezone')

const MIMETYPES = {
  MP4: 'video/mp4',
  M4A: 'audio/mp4',
  CHAT: 'text/plain',
  TRANSCRIPT: 'text/vtt',
  CC: 'text/vtt',
  TIMELINE: 'application/json',
}
const EXT = {
  MP4: 'mp4',
  M4A: 'm4a',
  CHAT: 'txt',
  TRANSCRIPT: 'vtt',
  CC: 'vtt',
  TIMELINE: 'json',
}
const ICONS = {
  MP4: 'video',
  M4A: 'file',
  CHAT: 'file',
  TRANSCRIPT: 'file',
  CC: 'file',
  FOLDER: 'folder',
  TIMELINE: 'file',
}

exports.getDateName = (start, end) => {
  return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')}`
}

exports.getAccountCreationDate = (results) => {
  return moment.utc(results.created_at)
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

exports.getDateNextPagePath = (end) => {
  return `?cursor=${end.format('YYYY-MM-DD')}`
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

exports.getItemName = (item, userResponse) => {
  const start = moment.tz(item.start_time || item.recording_start, userResponse.timezone || 'UTC')
    .format('YYYY-MM-DD, HH:mm')

  if (item.file_type) {
    const ext = EXT[item.file_type] ? `.${EXT[item.file_type]}` : ''
    const itemType = item.recording_type ? ` - ${item.recording_type.split('_').join(' ')}` : ''
    return `${item.topic}${itemType} (${start})${ext}`
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
  if (item.file_type && item.file_type === 'CC') {
    return `${encodeURIComponent(item.meeting_id)}__CC__${encodeURIComponent(item.recording_start)}`
  } if (item.file_type) {
    return `${encodeURIComponent(item.meeting_id)}__${encodeURIComponent(item.id)}`
  }
  return `${encodeURIComponent(item.uuid)}`
}

exports.getRequestPath = (item) => {
  if (item.file_type && item.file_type === 'CC') {
    return `${encodeURIComponent(item.meeting_id)}?recordingId=CC&recordingStart=${encodeURIComponent(item.recording_start)}`
  } if (item.file_type) {
    return `${encodeURIComponent(item.meeting_id)}?recordingId=${encodeURIComponent(item.id)}`
  }
  // Zoom meeting ids are reused so we need to use the UUID. Also, these UUIDs can contain `/` characters which require
  // double encoding (see https://devforum.zoom.us/t/double-encode-meeting-uuids/23729).
  return `${encodeURIComponent(encodeURIComponent(item.uuid))}`
}

exports.getStartDate = (item) => {
  if (item.file_type === 'CC') {
    return item.recording_start
  }
  return item.start_time
}

exports.getSize = (item) => {
  if (item.file_type && item.file_type === 'CC') {
    const maxExportFileSize = 1024 * 1024
    return maxExportFileSize
  } if (item.file_type) {
    return item.file_size
  }
  return item.total_size
}

exports.getItemTopic = (item) => {
  return item.topic
}
