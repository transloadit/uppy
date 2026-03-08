import { http, HttpResponse } from 'msw'

/**
 * MSW handlers that mock the tus resumable upload protocol.
 *
 * Handles the tus v1 flow used by the example tests:
 * 1. POST /files/ — create upload, return Location header
 * 2. PATCH /files/:id — receive chunk, return new Upload-Offset
 *
 * See https://tus.io/protocols/resumable-upload#protocol
 */
export const TUS_ENDPOINT = 'https://tusd.tusdemo.net/files/'

export const tusHandlers = [
  http.post(TUS_ENDPOINT, async ({ request }) => {
    const uploadLength = request.headers.get('Upload-Length') || '0'
    return new HttpResponse(null, {
      status: 201,
      headers: {
        Location: `${TUS_ENDPOINT}mock-upload-id`,
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': '0',
        'Upload-Length': uploadLength,
      },
    })
  }),
  http.patch(`${TUS_ENDPOINT}:id`, async ({ request }) => {
    const uploadOffset = request.headers.get('Upload-Offset') || '0'
    const body = await request.arrayBuffer()
    const newOffset = Number.parseInt(uploadOffset, 10) + body.byteLength
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Tus-Resumable': '1.0.0',
        'Upload-Offset': String(newOffset),
      },
    })
  }),
]
