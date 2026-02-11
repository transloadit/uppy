import moment from 'moment-timezone'
import { isRecord } from '../../helpers/type-guards.ts'

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

type ZoomFileType = keyof typeof MIMETYPES

type ZoomUserResponse = {
  email?: string
  timezone?: string
}

type ZoomItem = {
  topic: string
  uuid?: string
  meeting_id?: string
  start_time?: string
  file_type?: ZoomFileType
  id?: string
  recording_start?: string
  recording_type?: string
  file_size?: number
  total_size?: number
  deleted_time?: string
  status?: string
  download_url?: string
}

type ZoomRecordingFile = ZoomItem & {
  file_type: ZoomFileType
  id: string
  meeting_id: string
  recording_start: string
}

type ZoomMeeting = ZoomItem & {
  uuid: string
  meeting_id: string
  topic: string
  recording_files?: ZoomRecordingFile[]
}

type ZoomAdaptedItem = {
  isFolder: boolean
  icon: string
  name: string
  mimeType: string | null
  id: string
  thumbnail: null
  requestPath: string
  modifiedDate: string | undefined
  size: number | undefined
  custom: { topic: string }
}

const getUserEmail = (results: ZoomUserResponse): string | undefined => {
  return results.email
}

// we rely on the file_type attribute to differentiate a recording file from other items
const getIsFolder = (item: ZoomItem): boolean => {
  return !item.file_type
}

const getItemName = (
  item: ZoomItem,
  userResponse: ZoomUserResponse,
): string => {
  const timestamp =
    item.start_time || item.recording_start || new Date().toISOString()
  const start = moment
    .tz(timestamp, userResponse.timezone || 'UTC')
    .format('YYYY-MM-DD, HH:mm')

  if (item.file_type) {
    const ext = Object.hasOwn(EXT, item.file_type)
      ? `.${EXT[item.file_type]}`
      : ''
    const itemType =
      'recording_type' in item && item.recording_type
        ? ` - ${item.recording_type.split('_').join(' ')}`
        : ''
    return `${item.topic}${itemType} (${start})${ext}`
  }

  return `${item.topic} (${start})`
}

const getIcon = (item: ZoomItem): string => {
  if (item.file_type) {
    return ICONS[item.file_type] ?? ICONS.FOLDER
  }
  return ICONS.FOLDER
}

const getMimeType = (item: ZoomItem): string | null => {
  if (item.file_type) {
    return MIMETYPES[item.file_type] ?? null
  }
  return null
}

const getId = (item: ZoomItem): string => {
  if (item.file_type && item.file_type === 'CC') {
    if (
      typeof item.meeting_id !== 'string' ||
      typeof item.recording_start !== 'string'
    ) {
      throw new Error(
        'Unexpected Zoom item: missing meeting_id/recording_start',
      )
    }
    return `${encodeURIComponent(item.meeting_id)}__CC__${encodeURIComponent(item.recording_start)}`
  }
  if (item.file_type) {
    if (typeof item.meeting_id !== 'string' || typeof item.id !== 'string') {
      throw new Error('Unexpected Zoom item: missing meeting_id/id')
    }
    return `${encodeURIComponent(item.meeting_id)}__${encodeURIComponent(item.id)}`
  }
  if (typeof item.uuid !== 'string') {
    throw new Error('Unexpected Zoom item: missing uuid')
  }
  return `${encodeURIComponent(item.uuid)}`
}

const getRequestPath = (item: ZoomItem): string => {
  if (item.file_type && item.file_type === 'CC') {
    if (
      typeof item.meeting_id !== 'string' ||
      typeof item.recording_start !== 'string'
    ) {
      throw new Error(
        'Unexpected Zoom item: missing meeting_id/recording_start',
      )
    }
    return `${encodeURIComponent(item.meeting_id)}?recordingId=CC&recordingStart=${encodeURIComponent(item.recording_start)}`
  }
  if (item.file_type) {
    if (typeof item.meeting_id !== 'string' || typeof item.id !== 'string') {
      throw new Error('Unexpected Zoom item: missing meeting_id/id')
    }
    return `${encodeURIComponent(item.meeting_id)}?recordingId=${encodeURIComponent(item.id)}`
  }
  // Zoom meeting ids are reused so we need to use the UUID. Also, these UUIDs can contain `/` characters which require
  // double encoding (see https://devforum.zoom.us/t/double-encode-meeting-uuids/23729).
  if (typeof item.uuid !== 'string') {
    throw new Error('Unexpected Zoom item: missing uuid')
  }
  return `${encodeURIComponent(encodeURIComponent(item.uuid))}`
}

const getStartDate = (item: ZoomItem): string | undefined => {
  if (item.file_type === 'CC') {
    return item.recording_start
  }
  return item.start_time
}

const getSize = (item: ZoomItem): number | undefined => {
  if (item.file_type && item.file_type === 'CC') {
    const maxExportFileSize = 1024 * 1024
    return maxExportFileSize
  }
  if (item.file_type) {
    return item.file_size
  }
  return item.total_size
}

const getItemTopic = (item: ZoomItem): string => {
  return item.topic
}

function isZoomRecordingFile(value: unknown): value is ZoomRecordingFile {
  if (!isRecord(value)) return false
  const fileType = value['file_type']
  if (typeof fileType !== 'string') return false
  if (!Object.hasOwn(MIMETYPES, fileType)) return false
  return (
    typeof value['id'] === 'string' &&
    typeof value['meeting_id'] === 'string' &&
    typeof value['recording_start'] === 'string'
  )
}

function toZoomMeeting(value: unknown): ZoomMeeting | null {
  if (!isRecord(value)) return null
  const uuid = value['uuid']
  const meetingId = value['meeting_id']
  const topic = value['topic']
  if (typeof uuid !== 'string') return null
  if (typeof meetingId !== 'string') return null
  if (typeof topic !== 'string') return null

  const startTime = value['start_time']
  const totalSize = value['total_size']
  const recordingFilesValue = value['recording_files']
  const recordingFiles: ZoomRecordingFile[] = Array.isArray(recordingFilesValue)
    ? recordingFilesValue.filter(isZoomRecordingFile)
    : []

  const out: ZoomMeeting = {
    uuid,
    meeting_id: meetingId,
    topic,
    recording_files: recordingFiles,
  }
  if (typeof startTime === 'string') out.start_time = startTime
  if (typeof totalSize === 'number') out.total_size = totalSize
  return out
}

const adaptData = (
  userResponse: ZoomUserResponse,
  results: unknown,
):
  | {
      nextPagePath: null
      items: ZoomAdaptedItem[]
      username: string | undefined
    }
  | { items: [] } => {
  if (!results || !isRecord(results)) {
    return { items: [] }
  }

  const data: {
    nextPagePath: null
    items: ZoomAdaptedItem[]
    username: string | undefined
  } = {
    nextPagePath: null,
    items: [],
    username: getUserEmail(userResponse),
  }

  let itemsToProcess: ZoomItem[] = []
  const meetingsValue = results['meetings']
  const recordingFilesValue = results['recording_files']

  if (Array.isArray(meetingsValue)) {
    itemsToProcess = meetingsValue
      .map(toZoomMeeting)
      .filter((meeting): meeting is ZoomMeeting => meeting != null)
      .filter((meeting) =>
        meeting.recording_files?.some(
          (file) =>
            !file.deleted_time &&
            file.status === 'completed' &&
            typeof file.download_url === 'string' &&
            file.download_url.length > 0,
        ),
      )
  } else if (
    Array.isArray(recordingFilesValue) &&
    typeof results['topic'] === 'string'
  ) {
    const topic = results['topic']
    itemsToProcess = recordingFilesValue
      .filter(isZoomRecordingFile)
      .map((item) => ({ ...item, topic }))
      .filter(
        (file) =>
          file.file_type !== 'TIMELINE' &&
          !file.deleted_time &&
          file.status === 'completed' &&
          typeof file.download_url === 'string' &&
          file.download_url.length > 0,
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
