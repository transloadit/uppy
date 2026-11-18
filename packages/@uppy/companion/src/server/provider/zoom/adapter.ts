import moment from 'moment-timezone'
import { z } from 'zod'

import { isRecord } from '../../helpers/type-guards.js'

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

// Zoom leaves out fields depending on the file type and the recording's state, and a field we
// don't need should never hide a recording. So every field is optional, and a value of the wrong
// type reads as missing instead of rejecting the whole item.
const optionalString = z.string().optional().catch(undefined)
const optionalNumber = z.number().optional().catch(undefined)

const zoomRecordingFileSchema = z.object({
  id: optionalString,
  meeting_id: optionalString,
  recording_start: optionalString,
  recording_type: optionalString,
  file_type: optionalString,
  file_size: optionalNumber,
  status: optionalString,
  deleted_time: optionalString,
  download_url: optionalString,
})

// Used for both a meeting in `GET /users/me/recordings` and the body of
// `GET /meetings/{meetingId}/recordings`, which describe the meeting the same way.
const zoomMeetingSchema = z.object({
  uuid: z.string(),
  topic: z.string(),
  start_time: optionalString,
  total_size: optionalNumber,
  recording_files: z.array(z.unknown()).catch([]),
})

type ZoomMeeting = z.infer<typeof zoomMeetingSchema>

type ZoomItem = {
  topic: string
  uuid?: string | undefined
  meeting_id?: string | undefined
  start_time?: string | undefined
  file_type?: ZoomFileType
  id?: string | undefined
  recording_start?: string | undefined
  recording_type?: string | undefined
  file_size?: number | undefined
  total_size?: number | undefined
}

type ZoomRecordingFile = ZoomItem & {
  file_type: ZoomFileType
  meeting_id: string
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
  const timestamp = item.start_time || item.recording_start
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

const getIcon = (item: ZoomItem) => {
  if (item.file_type) {
    return ICONS[item.file_type]
  }
  return ICONS.FOLDER
}

const getMimeType = (item: ZoomItem) => {
  if (item.file_type) {
    return MIMETYPES[item.file_type]
  }
  return null
}

// Zoom sends CC files, and some other files, without an `id`. Those are found again by their type
// and start time instead, which `findFile()` in ./index.ts matches on.
const isFoundByStart = (item: ZoomItem): boolean =>
  item.file_type === 'CC' || item.id == null

const getId = (item: ZoomItem): string => {
  if (item.file_type && isFoundByStart(item)) {
    return `${encodeURIComponent(String(item.meeting_id))}__${item.file_type}__${encodeURIComponent(String(item.recording_start))}`
  }
  if (item.file_type) {
    return `${encodeURIComponent(String(item.meeting_id))}__${encodeURIComponent(String(item.id))}`
  }
  return `${encodeURIComponent(String(item.uuid))}`
}

const getRequestPath = (item: ZoomItem): string => {
  if (item.file_type && isFoundByStart(item)) {
    return `${encodeURIComponent(String(item.meeting_id))}?recordingId=${item.file_type}&recordingStart=${encodeURIComponent(String(item.recording_start))}`
  }
  if (item.file_type) {
    return `${encodeURIComponent(String(item.meeting_id))}?recordingId=${encodeURIComponent(String(item.id))}`
  }
  // Zoom meeting ids are reused so we need to use the UUID. Also, these UUIDs can contain `/` characters which require
  // double encoding (see https://devforum.zoom.us/t/double-encode-meeting-uuids/23729).
  return `${encodeURIComponent(encodeURIComponent(String(item.uuid)))}`
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

const isZoomFileType = (value: string | undefined): value is ZoomFileType =>
  value != null && Object.hasOwn(MIMETYPES, value)

function toZoomMeeting(value: unknown): ZoomMeeting | null {
  const parsed = zoomMeetingSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

/**
 * Returns the file as it is listed inside its meeting, or null when there is nothing to download.
 * The year listing uses this too, so it only shows meetings that have files to open.
 */
function toListedFile(
  value: unknown,
  meeting: ZoomMeeting,
): ZoomRecordingFile | null {
  const parsed = zoomRecordingFileSchema.safeParse(value)
  if (!parsed.success) return null
  const file = parsed.data
  const fileType = file.file_type
  if (!isZoomFileType(fileType) || fileType === 'TIMELINE') return null
  if (file.deleted_time || file.status !== 'completed' || !file.download_url) {
    return null
  }

  const listed: ZoomRecordingFile = {
    ...file,
    file_type: fileType,
    topic: meeting.topic,
    // The meeting's UUID is what Zoom puts in `meeting_id`.
    meeting_id: file.meeting_id ?? meeting.uuid,
  }
  if (isFoundByStart(listed)) {
    return listed.recording_start == null ? null : listed
  }
  // Only the name uses the start time of a file found by its `id`.
  listed.recording_start ??= meeting.start_time
  return listed
}

const listFiles = (meeting: ZoomMeeting): ZoomRecordingFile[] =>
  meeting.recording_files
    .map((file) => toListedFile(file, meeting))
    .filter((file) => file != null)

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

  if (Array.isArray(meetingsValue)) {
    itemsToProcess = meetingsValue
      .map(toZoomMeeting)
      .filter((meeting) => meeting != null)
      .filter((meeting) => listFiles(meeting).length > 0)
  } else {
    const meeting = toZoomMeeting(results)
    itemsToProcess = meeting ? listFiles(meeting) : []
  }

  for (const item of itemsToProcess) {
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
  }
  return data
}

export default adaptData
