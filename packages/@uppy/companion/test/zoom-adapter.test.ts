import { describe, expect, test } from 'vitest'

import adaptData from '../dist/server/provider/zoom/adapter.js'
import { zoomMeeting } from './fixtures/zoom.js'

const user = { email: 'john.doe@transloadit.com', timezone: 'UTC' }

const completedFile = {
  meeting_id: 'DUMMY-UUID==',
  recording_start: '2020-05-29T13:23:57Z',
  status: 'completed',
  download_url: 'https://us02web.zoom.us/rec/download/DUMMY-DOWNLOAD-PATH',
}

const withFiles = (files: unknown[]) => ({
  ...zoomMeeting(),
  recording_files: files,
})

describe('Zoom meeting folder', () => {
  test('lists files that come without an id by their type and start time', () => {
    const { items } = adaptData(
      user,
      withFiles([
        { ...completedFile, file_type: 'CC' },
        { ...completedFile, file_type: 'TRANSCRIPT' },
      ]),
    )

    expect(items).toEqual([
      expect.objectContaining({
        name: 'DUMMY TOPIC (2020-05-29, 13:23).vtt',
        id: 'DUMMY-UUID%3D%3D__CC__2020-05-29T13%3A23%3A57Z',
        requestPath:
          'DUMMY-UUID%3D%3D?recordingId=CC&recordingStart=2020-05-29T13%3A23%3A57Z',
      }),
      expect.objectContaining({
        name: 'DUMMY TOPIC (2020-05-29, 13:23).vtt',
        id: 'DUMMY-UUID%3D%3D__TRANSCRIPT__2020-05-29T13%3A23%3A57Z',
        requestPath:
          'DUMMY-UUID%3D%3D?recordingId=TRANSCRIPT&recordingStart=2020-05-29T13%3A23%3A57Z',
      }),
    ])
  })

  test('falls back to the meeting for a missing meeting_id and start time', () => {
    const { items } = adaptData(
      user,
      withFiles([
        {
          id: 'DUMMY-FILE-ID',
          file_type: 'MP4',
          status: 'completed',
          download_url: completedFile.download_url,
        },
      ]),
    )

    expect(items).toEqual([
      expect.objectContaining({
        name: 'DUMMY TOPIC (2020-05-29, 13:19).mp4',
        id: 'DUMMY-UUID%3D%3D__DUMMY-FILE-ID',
        requestPath: 'DUMMY-UUID%3D%3D?recordingId=DUMMY-FILE-ID',
      }),
    ])
  })

  test('keeps a file whose unused fields have unexpected types', () => {
    const { items } = adaptData(
      user,
      withFiles([
        {
          ...completedFile,
          id: 'DUMMY-FILE-ID',
          file_type: 'M4A',
          file_size: '758051',
          recording_type: null,
        },
      ]),
    )

    expect(items).toEqual([
      expect.objectContaining({
        name: 'DUMMY TOPIC (2020-05-29, 13:23).m4a',
        size: undefined,
      }),
    ])
  })

  test('leaves out files there is nothing to download from', () => {
    const { items } = adaptData(
      user,
      withFiles([
        { ...completedFile, file_type: 'TIMELINE' },
        { ...completedFile, file_type: 'MP4', status: 'processing' },
        {
          ...completedFile,
          file_type: 'MP4',
          deleted_time: '2020-06-01T00:00:00Z',
        },
        { ...completedFile, file_type: 'MP4', download_url: '' },
        { ...completedFile, file_type: 'CC', recording_start: undefined },
      ]),
    )

    expect(items).toEqual([])
  })
})

describe('Zoom year listing', () => {
  test('shows a meeting whose only file is a caption without an id', () => {
    const { items } = adaptData(user, {
      meetings: [withFiles([{ ...completedFile, file_type: 'CC' }])],
    })

    expect(items).toEqual([
      expect.objectContaining({ isFolder: true, id: 'DUMMY-UUID%3D%3D' }),
    ])
  })

  test('hides a meeting that only has a timeline', () => {
    const { items } = adaptData(user, {
      meetings: [withFiles([{ ...completedFile, file_type: 'TIMELINE' }])],
    })

    expect(items).toEqual([])
  })
})
