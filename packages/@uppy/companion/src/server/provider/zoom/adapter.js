import moment from 'moment-timezone'

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

const getUserEmail = (results) => {
  return results.email
}

// we rely on the file_type attribute to differentiate a recording file from other items
const getIsFolder = (item) => {
  return !item.file_type
}

const getItemName = (item, userResponse) => {
  const start = moment
    .tz(item.start_time || item.recording_start, userResponse.timezone || 'UTC')
    .format('YYYY-MM-DD, HH:mm')

  if (item.file_type) {
    const ext = EXT[item.file_type] ? `.${EXT[item.file_type]}` : ''
    const itemType = item.recording_type
      ? ` - ${item.recording_type.split('_').join(' ')}`
      : ''
    return `${item.topic}${itemType} (${start})${ext}`
  }

  return `${item.topic} (${start})`
}

const getIcon = (item) => {
  if (item.file_type) {
    return ICONS[item.file_type]
  }
  return ICONS.FOLDER
}

const getMimeType = (item) => {
  if (item.file_type) {
    return MIMETYPES[item.file_type]
  }
  return null
}

const getId = (item) => {
  if (item.file_type && item.file_type === 'CC') {
    return `${encodeURIComponent(item.meeting_id)}__CC__${encodeURIComponent(item.recording_start)}`
  }
  if (item.file_type) {
    return `${encodeURIComponent(item.meeting_id)}__${encodeURIComponent(item.id)}`
  }
  return `${encodeURIComponent(item.uuid)}`
}

const getRequestPath = (item) => {
  if (item.file_type && item.file_type === 'CC') {
    return `${encodeURIComponent(item.meeting_id)}?recordingId=CC&recordingStart=${encodeURIComponent(item.recording_start)}`
  }
  if (item.file_type) {
    return `${encodeURIComponent(item.meeting_id)}?recordingId=${encodeURIComponent(item.id)}`
  }
  // Zoom meeting ids are reused so we need to use the UUID. Also, these UUIDs can contain `/` characters which require
  // double encoding (see https://devforum.zoom.us/t/double-encode-meeting-uuids/23729).
  return `${encodeURIComponent(encodeURIComponent(item.uuid))}`
}

const getStartDate = (item) => {
  if (item.file_type === 'CC') {
    return item.recording_start
  }
  return item.start_time
}

const getSize = (item) => {
  if (item.file_type && item.file_type === 'CC') {
    const maxExportFileSize = 1024 * 1024
    return maxExportFileSize
  }
  if (item.file_type) {
    return item.file_size
  }
  return item.total_size
}

const getItemTopic = (item) => {
  return item.topic
}

const adaptData = (userResponse, results) => {
  if (!results) {
    return { items: [] }
  }

  const data = {
    nextPagePath: null,
    items: [],
    username: getUserEmail(userResponse),
  }

  let itemsToProcess = []
  if (results.meetings) {
    itemsToProcess = results.meetings.filter((meeting) =>
      meeting.recording_files?.some(
        (file) =>
          !file.deleted_time &&
          file.status === 'completed' &&
          file.download_url,
      ),
    )
  } else if (results.recording_files) {
    itemsToProcess = results.recording_files
      .map((item) => {
        return { ...item, topic: results.topic }
      })
      .filter(
        (file) =>
          file.file_type !== 'TIMELINE' &&
          !file.deleted_time &&
          file.status === 'completed' &&
          file.download_url,
      )
  }

  itemsToProcess.forEach((item) => {
    data.items.push({
      isFolder: getIsFolder(item),
      icon: getIcon(item),
      name: getItemName(item, userResponse),
      mimeType: getMimeType(item),
      id: getId(item),
      thumbnail: null,
      requestPath: getRequestPath(item),
      modifiedDate: getStartDate(item),
      size: getSize(item),
      custom: {
        topic: getItemTopic(item),
      },
    })
  })
  return data
}

export default adaptData
