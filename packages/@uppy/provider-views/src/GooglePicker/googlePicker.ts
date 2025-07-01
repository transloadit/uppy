import type { MutableRef } from 'preact/hooks'

// https://developers.google.com/photos/picker/reference/rest/v1/mediaItems
// Note that the google api doc is not correct, hence some things are optional here but not in their docs
export interface MediaItemBase {
  id: string
  createTime: string
}

interface MediaFileMetadataBase {
  width: number
  height: number
}

interface MediaFileBase {
  baseUrl: string
  mimeType: string
  filename: string
}

export interface VideoMediaItem extends MediaItemBase {
  type: 'VIDEO'
  mediaFile: MediaFileBase & {
    mediaFileMetadata: MediaFileMetadataBase & {
      videoMetadata: {
        cameraMake?: string
        cameraModel?: string
        fps?: number
        processingStatus: 'UNSPECIFIED' | 'PROCESSING' | 'READY' | 'FAILED'
      }
    }
  }
}

export interface PhotoMediaItem extends MediaItemBase {
  type: 'PHOTO'
  mediaFile: MediaFileBase & {
    mediaFileMetadata: MediaFileMetadataBase & {
      photoMetadata?: {
        cameraMake?: string
        cameraModel?: string
        focalLength?: number
        apertureFNumber?: number
        isoEquivalent?: number
        exposureTime?: string
      }
    }
  }
}

export interface UnspecifiedMediaItem extends MediaItemBase {
  type: 'TYPE_UNSPECIFIED'
  mediaFile: MediaFileBase & {
    mediaFileMetadata: MediaFileMetadataBase
  }
}

export type MediaItem = VideoMediaItem | PhotoMediaItem | UnspecifiedMediaItem

export type MediaType = MediaItem['type']

// https://developers.google.com/photos/picker/reference/rest/v1/sessions
export interface PickingSession {
  id: string
  pickerUri: string
  pollingConfig: {
    pollInterval: string
    timeoutIn: string
  }
  expireTime: string
  mediaItemsSet: boolean
}

export interface PickedItemBase {
  id: string
  mimeType: string
  name: string
}

export interface PickedDriveItem extends PickedItemBase {
  platform: 'drive'
}

export interface PickedPhotosItem extends PickedItemBase {
  platform: 'photos'
  url: string
  metadata?: Record<string, string | number> // I think string and number is OK in Companion
}

export type PickedItem = PickedPhotosItem | PickedDriveItem

type PickerType = 'drive' | 'photos'

const getAuthHeader = (token: string) => ({
  authorization: `Bearer ${token}`,
})

const injectedScripts = new Set<string>()
let driveApiLoaded = false

// https://stackoverflow.com/a/39008859/6519037
async function injectScript(src: string) {
  if (injectedScripts.has(src)) return

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', (e) => reject(e.error))
    document.head.appendChild(script)
  })
  injectedScripts.add(src)
}

export async function ensureScriptsInjected(
  pickerType: PickerType,
): Promise<void> {
  await Promise.all([
    injectScript('https://accounts.google.com/gsi/client'), // Google Identity Services
    (async () => {
      await injectScript('https://apis.google.com/js/api.js')

      if (pickerType === 'drive' && !driveApiLoaded) {
        await new Promise<void>((resolve) =>
          gapi.load('client:picker', () => resolve()),
        )
        await gapi.client.load(
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        )
        driveApiLoaded = true
      }
    })(),
  ])
}

async function isTokenValid(
  accessToken: string,
  signal: AbortSignal | undefined,
) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    { signal },
  )
  if (response.ok) {
    return true
  }
  // console.warn('Token is invalid or expired:', response.status, await response.text());
  // Token is invalid or expired
  return false
}

export async function authorize({
  pickerType,
  clientId,
  accessToken,
}: {
  pickerType: PickerType
  clientId: string
  accessToken?: string | null | undefined
}): Promise<string> {
  const response = await new Promise<google.accounts.oauth2.TokenResponse>(
    (resolve, reject) => {
      const scopes =
        pickerType === 'drive'
          ? ['https://www.googleapis.com/auth/drive.file']
          : ['https://www.googleapis.com/auth/photospicker.mediaitems.readonly']

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        // Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
        scope: scopes.join(' '),
        callback: resolve,
        error_callback: reject,
      })

      if (accessToken === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' })
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' })
      }
    },
  )

  if (response.error) {
    throw new Error(`OAuth2 error: ${response.error}`)
  }
  return response.access_token
}

export async function logout(accessToken: string): Promise<void> {
  await new Promise<void>((resolve) =>
    google.accounts.oauth2.revoke(accessToken, resolve),
  )
}

export class InvalidTokenError extends Error {
  constructor() {
    super('Invalid or expired token')
    this.name = 'InvalidTokenError'
  }
}

export async function showDrivePicker({
  token,
  apiKey,
  appId,
  onFilesPicked,
  signal,
}: {
  token: string
  apiKey: string
  appId: string
  onFilesPicked: (files: PickedItem[], accessToken: string) => void
  signal: AbortSignal | undefined
}): Promise<void> {
  // google drive picker will crash hard if given an invalid token, so we need to check it first
  // https://github.com/transloadit/uppy/pull/5443#pullrequestreview-2452439265
  if (!(await isTokenValid(token, signal))) {
    throw new InvalidTokenError()
  }

  const onPicked = (picked: google.picker.ResponseObject) => {
    if (picked.action === google.picker.Action.PICKED) {
      // console.log('Picker response', JSON.stringify(picked, null, 2));
      onFilesPicked(
        picked.docs.map((doc) => ({
          platform: 'drive',
          id: doc.id,
          name: doc.name,
          mimeType: doc.mimeType,
        })),
        token,
      )
    }
  }

  const picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.NAV_HIDDEN)
    .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    .setDeveloperKey(apiKey)
    .setAppId(appId)
    .setOAuthToken(token)
    .addView(
      new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        // Note: setEnableDrives doesn't seem to work
        // .setEnableDrives(true)
        .setSelectFolderEnabled(false)
        .setMode(google.picker.DocsViewMode.LIST),
    )
    // NOTE: photos is broken and results in an error being returned from Google
    // I think it's the old Picasa photos
    // .addView(google.picker.ViewId.PHOTOS)
    .setCallback(onPicked)
    .build()

  picker.setVisible(true)
  signal?.addEventListener('abort', () => picker.dispose())
}

export async function showPhotosPicker({
  token,
  pickingSession,
  onPickingSessionChange,
  signal,
}: {
  token: string
  pickingSession: PickingSession | undefined
  onPickingSessionChange: (ps: PickingSession) => void
  signal: AbortSignal | undefined
}): Promise<void> {
  // https://developers.google.com/photos/picker/guides/get-started-picker
  const headers = getAuthHeader(token)

  let newPickingSession = pickingSession
  if (newPickingSession == null) {
    const createSessionResponse = await fetch(
      'https://photospicker.googleapis.com/v1/sessions',
      { method: 'post', headers, signal },
    )

    if (createSessionResponse.status === 401) {
      const resp = await createSessionResponse.json()
      if (resp.error?.status === 'UNAUTHENTICATED') {
        throw new InvalidTokenError()
      }
    }

    if (!createSessionResponse.ok) {
      throw new Error('Failed to create a session')
    }
    newPickingSession = (await createSessionResponse.json()) as PickingSession

    onPickingSessionChange(newPickingSession)
  }

  const w = window.open(newPickingSession.pickerUri)
  signal?.addEventListener('abort', () => w?.close())
}

async function resolvePickedPhotos({
  accessToken,
  pickingSession,
  signal,
}: {
  accessToken: string
  pickingSession: PickingSession
  signal: AbortSignal
}) {
  const headers = getAuthHeader(accessToken)

  let pageToken: string | undefined
  let mediaItems: MediaItem[] = []
  do {
    const pageSize = 100
    const response = await fetch(
      `https://photospicker.googleapis.com/v1/mediaItems?${new URLSearchParams({ sessionId: pickingSession.id, pageSize: String(pageSize), ...(pageToken && { pageToken }) }).toString()}`,
      { headers, signal },
    )
    if (!response.ok) throw new Error('Failed to get a media items')
    const {
      mediaItems: batchMediaItems,
      nextPageToken,
    }: { mediaItems: MediaItem[]; nextPageToken?: string } =
      await response.json()
    pageToken = nextPageToken
    mediaItems.push(...batchMediaItems)
  } while (pageToken)

  // Filter out items that aren't fully processed or ready
  mediaItems = mediaItems.flatMap((i) =>
    i.type === 'PHOTO' ||
    (i.type === 'VIDEO' &&
      i.mediaFile.mediaFileMetadata.videoMetadata.processingStatus === 'READY')
      ? [i]
      : [],
  )

  // Transform media items into picked items with appropriate metadata
  return mediaItems.map((mediaItem) => {
    const {
      id,
      type,
      mediaFile: { mimeType, filename, baseUrl },
    } = mediaItem

    return {
      platform: 'photos' as const,
      id,
      mimeType,
      // we want the original resolution, so we don't append any parameter to the baseUrl
      // https://developers.google.com/photos/library/guides/access-media-items#base-urls
      url: type === 'VIDEO' ? `${baseUrl}=dv` : `${baseUrl}=d`, // dv to download video, d to get original image (non cropped)
      name: filename,
      metadata: {
        // Note that metadata keys `filename` and `type` have special meanings in Companion
        // and should not be overridden
        googlePhotosFileType: mediaItem.type,
        createTime: mediaItem.createTime,

        width: mediaItem.mediaFile.mediaFileMetadata.width,
        height: mediaItem.mediaFile.mediaFileMetadata.height,

        ...(mediaItem.type === 'PHOTO' && {
          cameraMake:
            mediaItem.mediaFile.mediaFileMetadata.photoMetadata?.cameraMake,
          cameraModel:
            mediaItem.mediaFile.mediaFileMetadata.photoMetadata?.cameraModel,
          focalLength:
            mediaItem.mediaFile.mediaFileMetadata.photoMetadata?.focalLength,
          apertureFNumber:
            mediaItem.mediaFile.mediaFileMetadata.photoMetadata
              ?.apertureFNumber,
          isoEquivalent:
            mediaItem.mediaFile.mediaFileMetadata.photoMetadata?.isoEquivalent,
          exposureTime:
            mediaItem.mediaFile.mediaFileMetadata.photoMetadata?.exposureTime,
        }),

        ...(mediaItem.type === 'VIDEO' && {
          cameraMake:
            mediaItem.mediaFile.mediaFileMetadata.videoMetadata.cameraMake,
          cameraModel:
            mediaItem.mediaFile.mediaFileMetadata.videoMetadata.cameraModel,
          fps: mediaItem.mediaFile.mediaFileMetadata.videoMetadata.fps,
          processingStatus:
            mediaItem.mediaFile.mediaFileMetadata.videoMetadata
              .processingStatus,
        }),
      },
    }
  })
}

export async function pollPickingSession({
  pickingSessionRef,
  accessTokenRef,
  signal,
  onFilesPicked,
  onError,
}: {
  pickingSessionRef: MutableRef<PickingSession | undefined>
  accessTokenRef: MutableRef<string | null | undefined>
  signal: AbortSignal
  onFilesPicked: (files: PickedItem[], accessToken: string) => void
  onError: (err: unknown) => void
}): Promise<void> {
  // if we have an active session, poll it until it either times out, or the user selects some photos.
  // Note that the user can also just close the page, but we get no indication of that from Google when polling,
  // so we just have to continue polling in the background, so we can react to it
  // in case the user opens the photo selector again. Hence the infinite for loop
  for (let interval = 1; ; ) {
    try {
      if (pickingSessionRef.current != null) {
        interval = parseFloat(
          pickingSessionRef.current.pollingConfig.pollInterval,
        )
      } else {
        interval = 1
      }

      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, interval * 1000)),
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', reject)
        }),
      ])

      signal.throwIfAborted()

      const accessToken = accessTokenRef.current
      const pickingSession = pickingSessionRef.current

      if (pickingSession != null && accessToken != null) {
        const headers = getAuthHeader(accessToken)

        // https://developers.google.com/photos/picker/reference/rest/v1/sessions
        const response = await fetch(
          `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(pickingSession.id)}`,
          { headers, signal },
        )
        if (!response.ok) throw new Error('Failed to get session')
        const json: PickingSession = await response.json()
        if (json.mediaItemsSet) {
          // console.log('User picked!', json)
          const resolvedPhotos = await resolvePickedPhotos({
            accessToken,
            pickingSession,
            signal,
          })
          pickingSessionRef.current = undefined
          onFilesPicked(resolvedPhotos, accessToken)
        }
        if (pickingSession.pollingConfig.timeoutIn === '0s') {
          pickingSessionRef.current = undefined
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      // just report the error and continue polling
      onError(err)
    }
  }
}
