const moment = require('moment-timezone')

const DEFAULT_RANGE_MOS = 23

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

const getDateName = (start, end) => {
  return `${start.format('YYYY-MM-DD')} - ${end.format('YYYY-MM-DD')}`
}

const getAccountCreationDate = (results) => {
  return moment.utc(results.created_at)
}

const getUserEmail = (results) => {
  return results.email
}

const getDateFolderId = (start, end) => {
  return `${start.format('YYYY-MM-DD')}_${end.format('YYYY-MM-DD')}`
}

const getDateFolderRequestPath = (start, end) => {
  return `?from=${start.format('YYYY-MM-DD')}&to=${end.format('YYYY-MM-DD')}`
}

const getDateFolderModified = (end) => {
  return end.format('YYYY-MM-DD')
}

const getDateNextPagePath = (end) => {
  return `?cursor=${end.format('YYYY-MM-DD')}`
}

const getNextPagePath = (results) => {
  if (results.next_page_token) {
    return `?cursor=${results.next_page_token}&from=${results.from}&to=${results.to}`
  }
  return null
}
// we rely on the file_type attribute to differentiate a recording file from other items
const getIsFolder = (item) => {
  return !item.file_type
}

const getItemName = (item, userResponse) => {
  const start = moment.tz(item.start_time || item.recording_start, userResponse.timezone || 'UTC')
    .format('YYYY-MM-DD, HH:mm')

  if (item.file_type) {
    const ext = EXT[item.file_type] ? `.${EXT[item.file_type]}` : ''
    const itemType = item.recording_type ? ` - ${item.recording_type.split('_').join(' ')}` : ''
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
  } if (item.file_type) {
    return `${encodeURIComponent(item.meeting_id)}__${encodeURIComponent(item.id)}`
  }
  return `${encodeURIComponent(item.uuid)}`
}

const getRequestPath = (item) => {
  if (item.file_type && item.file_type === 'CC') {
    return `${encodeURIComponent(item.meeting_id)}?recordingId=CC&recordingStart=${encodeURIComponent(item.recording_start)}`
  } if (item.file_type) {
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
  } if (item.file_type) {
    return item.file_size
  }
  return item.total_size
}

const getItemTopic = (item) => {
  return item.topic
}

exports.initializeData = (body, initialEnd = null) => {
  let end = initialEnd || moment.utc().tz(body.timezone || 'UTC')
  const accountCreation = getAccountCreationDate(body).tz(body.timezone || 'UTC').startOf('day')
  const defaultLimit = end.clone().subtract(DEFAULT_RANGE_MOS, 'months').date(1).startOf('day')
  const allResultsShown = accountCreation > defaultLimit
  const limit = allResultsShown ? accountCreation : defaultLimit
  // if the limit is mid-month, keep that exact date
  let start = (end.isSame(limit, 'month') && limit.date() !== 1) ? limit.clone() : end.clone().date(1).startOf('day')

  const data = {
    items: [],
    username: getUserEmail(body),
  }

  while (end.isAfter(limit)) {
    data.items.push({
      isFolder: true,
      icon: 'folder',
      name: getDateName(start, end),
      mimeType: null,
      id: getDateFolderId(start, end),
      thumbnail: null,
      requestPath: getDateFolderRequestPath(start, end),
      modifiedDate: getDateFolderModified(end),
      size: null,
    })
    end = start.clone().subtract(1, 'days').endOf('day')
    start = (end.isSame(limit, 'month') && limit.date() !== 1) ? limit.clone() : end.clone().date(1).startOf('day')
  }
  data.nextPagePath = allResultsShown ? null : getDateNextPagePath(end)
  return data
}

exports.adaptData = (userResponse, results, query) => {
  if (!results) {
    return { items: [] }
  }

  // we query the zoom api by date (from 00:00 - 23:59 UTC) which may include
  // extra results for 00:00 - 23:59 local time that we want to filter out.
  const utcFrom = moment.tz(query.from, userResponse.timezone || 'UTC').startOf('day').tz('UTC')
  const utcTo = moment.tz(query.to, userResponse.timezone || 'UTC').endOf('day').tz('UTC')

  const data = {
    nextPagePath: getNextPagePath(results),
    items: [],
    username: getUserEmail(userResponse),
  }

  let items = []
  if (results.meetings) {
    items = results.meetings
      .map(item => { return { ...item, utcStart: moment.utc(item.start_time) } })
      .filter(item => moment.utc(item.start_time).isAfter(utcFrom) && moment.utc(item.start_time).isBefore(utcTo))
  } else {
    items = results.recording_files
      .map(item => { return { ...item, topic: results.topic } })
      .filter(file => file.file_type !== 'TIMELINE')
  }

  items.forEach(item => {
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
