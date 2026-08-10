import emitter from '../src/server/emitter/index.js'
import { isRecord } from '../src/server/helpers/type-guards.js'

type UploadMessage = Record<string, unknown> & { action: string }

function isUploadMessage(value: unknown): value is UploadMessage {
  return isRecord(value) && typeof value['action'] === 'string'
}

export const connect = (uploadToken: string): void => {
  emitter().emit(`connection:${uploadToken}`)
}

export const onProgress = (
  uploadToken: string,
  cb: (message: UploadMessage) => void,
): void => {
  emitter().on(uploadToken, (message: unknown) => {
    if (isUploadMessage(message) && message['action'] === 'progress') {
      cb(message)
    }
  })
}

export const onUploadSuccess = (
  uploadToken: string,
  cb: (message: UploadMessage) => void,
): void => {
  emitter().on(uploadToken, (message: unknown) => {
    if (isUploadMessage(message) && message['action'] === 'success') {
      cb(message)
    }
  })
}

export const onUploadError = (
  uploadToken: string,
  cb: (message: UploadMessage) => void,
): void => {
  emitter().on(uploadToken, (message: unknown) => {
    if (isUploadMessage(message) && message['action'] === 'error') {
      cb(message)
    }
  })
}
