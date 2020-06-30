const qs = require('qs')

const MIMETYPES = {
  MP4: 'video/mp4',
  M4A: 'audio/mp4',
  CHAT: 'text/plain',
  TRANSCRIPT: 'text/plain', // note: waiting confirmation, https://devforum.zoom.us/t/retrieve-all-past-zoom-cloud-recordings/22487/5?u=mokutsu
  CC: 'text/vtt'
}

exports.getQuery = (results, dateRange) => {
  const query = {
    cursor: dateRange.monthsInPast
  }
  const nextPageToken = results[results.length - 1].next_page_token
  query.nextPageToken = nextPageToken || ''

  return `?${qs.stringify(query)}`
}

exports.getItemName = (meeting, record, index) => {
  return `${meeting.topic}_${record.recording_start.slice(0, 10)}_${record.recording_type}${index > 0 ? `_pt_${index + 1}` : ''}.${record.file_type}`
}

exports.getMimeType = (item) => {
  return MIMETYPES[item.file_type]
}

exports.getId = (item) => {
  return `${encodeURIComponent(item.meeting_id)}?recordingId=${encodeURIComponent(item.id)}`
}

exports.getRequestPath = (item) => {
  return `${encodeURIComponent(item.meeting_id)}?recordingId=${encodeURIComponent(item.id)}`
}
exports.getStartDate = (item) => {
  return item.recording_start
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
