import { h } from 'preact'
import { Fragment } from 'preact/compat'
import type { UIPlugin, Uppy } from '@uppy/core'
import useStore from '@uppy/core/lib/useStore.js'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { useUppyPluginState } from '@uppy/core/lib/useUppyState.js'
import type { AsyncStore } from '@uppy/core/lib/Uppy.js'

export type PluginState = {
  scriptsLoaded: boolean
}

// https://developers.google.com/photos/picker/reference/rest/v1/mediaItems
export interface MediaItemBase {
  id: string
  createTime: string
}

interface MediaFileMetadataBase {
  width: number
  height: number
  cameraMake: string
  cameraModel: string
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
        fps: number
        processingStatus: 'UNSPECIFIED' | 'PROCESSING' | 'READY' | 'FAILED'
      }
    }
  }
}

export interface PhotoMediaItem extends MediaItemBase {
  type: 'PHOTO'
  mediaFile: MediaFileBase & {
    mediaFileMetadata: MediaFileMetadataBase & {
      photoMetadata: {
        focalLength: number
        apertureFNumber: number
        isoEquivalent: number
        exposureTime: string
      }
    }
  }
}

export interface UnspecifiedMediaItem extends MediaItemBase {
  type: 'TYPE_UNSPECIFIED'
  mediaFile: MediaFileBase
}

export type MediaItem = VideoMediaItem | PhotoMediaItem | UnspecifiedMediaItem

// https://developers.google.com/photos/picker/reference/rest/v1/sessions
interface PickingSession {
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
}

export type PickedItem = PickedPhotosItem | PickedDriveItem

export const getAuthHeader = (token: string) => ({
  authorization: `Bearer ${token}`,
})

const injectedScripts = new Set<string>()

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

async function isTokenValid(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    )
    if (response.ok) {
      await response.json()
      return true
    }
    console.warn(
      'Token is invalid or expired:',
      response.status,
      await response.text(),
    )
    // Token is invalid or expired
    return false
  } catch (error) {
    console.error('Error checking token validity:', error)
    return false
  }
}

export type GooglePickerViewProps = {
  plugin: UIPlugin<any, any, any, PluginState>
  uppy: Uppy<any, any>
  clientId: string
  onFilesPicked: (files: PickedItem[], accessToken: string) => void
  storage: AsyncStore
} & (
  | {
      pickerType: 'drive'
      apiKey: string
      appId: string
    }
  | {
      pickerType: 'photos'
      apiKey?: undefined
      appId?: undefined
    }
)

export default function GooglePickerView({
  uppy,
  clientId,
  onFilesPicked,
  plugin,
  pickerType,
  apiKey,
  appId,
  storage,
}: GooglePickerViewProps) {
  const [{ scriptsLoaded }, setPluginState] = useUppyPluginState(plugin)
  const [loading, setLoading] = useState(false)
  const [signedOut, setSignedOut] = useState(false)
  const [accessToken, setAccessToken] = useStore(
    storage,
    `uppy:google-${pickerType}-picker:accessToken`,
  )

  const onPicked = useCallback(
    async (picked: google.picker.ResponseObject) => {
      if (picked.action === google.picker.Action.PICKED) {
        // console.log('Picker response', JSON.stringify(picked, null, 2));
        if (accessToken == null) throw new Error()
        onFilesPicked(
          picked['docs'].map((doc) => ({
            platform: 'drive',
            id: doc['id'],
            name: doc['name'],
            mimeType: doc['mimeType'],
          })),
          accessToken,
        )
      }
    },
    [accessToken, onFilesPicked],
  )

  const showDrivePicker = useCallback(
    (token: string) => {
      if (pickerType !== 'drive') throw new Error()
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
            .setSelectFolderEnabled(false),
        )
        // NOTE: photos is broken and results in an error being returned from Google
        // .addView(google.picker.ViewId.PHOTOS)
        .setCallback(onPicked)
        .build()

      picker.setVisible(true)
    },
    [apiKey, appId, onPicked, pickerType],
  )

  const pollStartTimeRef = useRef<number>()
  const [pickingSession, setPickingSession] = useState<PickingSession>()

  const showPhotosPicker = useCallback(
    async (token: string) => {
      // https://developers.google.com/photos/picker/guides/get-started-picker
      try {
        setLoading(true)

        const headers = getAuthHeader(token)

        let newPickingSession = pickingSession
        if (newPickingSession == null) {
          const createSessionResponse = await fetch(
            'https://photospicker.googleapis.com/v1/sessions',
            { method: 'post', headers },
          )

          if (createSessionResponse.status === 401) {
            const resp = await createSessionResponse.json()
            if (resp.error?.status === 'UNAUTHENTICATED') {
              setAccessToken(null)
              setSignedOut(true)
              return
            }
          }

          if (!createSessionResponse.ok)
            throw new Error('Failed to create a session')
          newPickingSession =
            (await createSessionResponse.json()) as PickingSession
          pollStartTimeRef.current = Date.now()
          setPickingSession(newPickingSession)
        }

        window.open(newPickingSession.pickerUri)
      } finally {
        setLoading(false)
      }
    },
    [pickingSession, setAccessToken],
  )

  const authorize = useCallback(async () => {
    setSignedOut(false)
    setLoading(true)
    try {
      const response = await new Promise<google.accounts.oauth2.TokenResponse>(
        (resolve, reject) => {
          const scopes =
            pickerType === 'drive' ?
              ['https://www.googleapis.com/auth/drive.readonly']
            : [
                'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
              ]

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
      const { access_token: newAccessToken } = response
      setAccessToken(newAccessToken)

      // showDrivePicker(newAccessToken);
    } catch (err) {
      uppy.log(err)
    } finally {
      setLoading(false)
    }
  }, [accessToken, clientId, pickerType, setAccessToken, uppy])

  useEffect(() => {
    ;(async () => {
      try {
        await Promise.all([
          injectScript('https://accounts.google.com/gsi/client'), // Google Identity Services
          (async () => {
            await injectScript('https://apis.google.com/js/api.js')

            if (pickerType === 'drive') {
              await new Promise<void>((resolve) =>
                gapi.load('client:picker', () => resolve()),
              )
              await gapi.client.load(
                'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
              )
            }

            setPluginState({ scriptsLoaded: true })
          })(),
        ])
      } catch (err) {
        uppy.log(err)
      }
    })()
  }, [pickerType, setPluginState, uppy])

  const showPicker = useCallback(async () => {
    if (accessToken === undefined) return // not yet loaded
    if (accessToken === null) {
      authorize()
      return
    }
    // google drive picker will crash hard if given an invalid token, so we need to check it first
    // https://github.com/transloadit/uppy/pull/5443#pullrequestreview-2452439265
    if (!(await isTokenValid(accessToken))) {
      authorize()
      return
    }
    if (pickerType === 'drive') {
      showDrivePicker(accessToken)
    } else {
      showPhotosPicker(accessToken)
    }
  }, [accessToken, authorize, pickerType, showDrivePicker, showPhotosPicker])

  // eslint-disable-next-line no-shadow
  const handlePhotosPicked = useCallback(
    async (params: { accessToken: string; pickingSession: PickingSession }) => {
      const headers = getAuthHeader(params.accessToken)

      let pageToken: string | undefined
      let mediaItems: MediaItem[] = []
      do {
        const pageSize = 100
        const response = await fetch(
          `https://photospicker.googleapis.com/v1/mediaItems?${new URLSearchParams({ sessionId: params.pickingSession.id, pageSize: String(pageSize) }).toString()}`,
          { headers },
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

      // todo show alert instead about invalid picked files?
      mediaItems = mediaItems.flatMap((i) =>
        (
          i.type === 'PHOTO' ||
          (i.type === 'VIDEO' &&
            i.mediaFile.mediaFileMetadata.videoMetadata.processingStatus ===
              'READY')
        ) ?
          [i]
        : [],
      )

      onFilesPicked(
        mediaItems.map(
          ({
            id,
            // we want the original resolution, so we don't append any parameter to the baseUrl
            // https://developers.google.com/photos/library/guides/access-media-items#base-urls
            mediaFile: { mimeType, filename, baseUrl },
          }) => ({
            platform: 'photos',
            id,
            mimeType,
            url: baseUrl,
            name: filename,
          }),
        ),
        params.accessToken,
      )
    },
    [onFilesPicked],
  )

  useEffect(() => {
    // if we have a session, poll it until it either times out, or the user selects some photos
    // note that the user can also just close the page, but we get no indication of that from Google when polling,
    // so we just have to continue polling, in case the user opens the photo selector again
    if (pickingSession == null || accessToken == null) return undefined

    const abortController = new AbortController()

    const headers = getAuthHeader(accessToken)

    ;(async () => {
      // poll session for user response
      for (;;) {
        try {
          const interval = parseFloat(pickingSession.pollingConfig.pollInterval)

          await Promise.race([
            new Promise((resolve) => setTimeout(resolve, interval * 1000)),
            new Promise((_resolve, reject) => {
              abortController.signal.onabort = reject
            }),
          ])

          abortController.signal.throwIfAborted()

          // https://developers.google.com/photos/picker/reference/rest/v1/sessions
          const response = await fetch(
            `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(pickingSession.id)}`,
            { headers },
          )
          if (!response.ok) throw new Error('Failed to get session')
          const json: PickingSession = await response.json()
          if (json.mediaItemsSet) {
            // console.log('User picked!', json)
            pollStartTimeRef.current = undefined
            setPickingSession(undefined)
            handlePhotosPicked({ accessToken, pickingSession })
            return
          }
          if (pickingSession.pollingConfig.timeoutIn === '0s') {
            uppy.log('Picking session timeout')
            pollStartTimeRef.current = undefined
            setPickingSession(undefined)
            return
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return
          }
          uppy.log(err)
        }
      }
    })()

    return () => abortController.abort()
  }, [accessToken, handlePhotosPicked, pickingSession, uppy])

  useEffect(() => {
    if (!scriptsLoaded || signedOut) {
      return
    }
    showPicker()
  }, [scriptsLoaded, showPicker, signedOut])

  const handleSignoutClick = useCallback(async () => {
    if (accessToken == null) return
    if (accessToken) {
      await new Promise<void>((resolve) =>
        google.accounts.oauth2.revoke(accessToken, resolve),
      )
      setAccessToken(null)
      setPickingSession(undefined)
      setSignedOut(true) // if user signs out, don't re-authenticate automatically
    }
  }, [accessToken, setAccessToken])

  if (!scriptsLoaded) {
    return null
  }

  // for photos, we will never go out of the loading/polling state
  if (loading) {
    return <div>{uppy.i18n('pleaseWait')}...</div>
  }

  if (accessToken == null) {
    return (
      <button type="button" disabled={loading} onClick={authorize}>
        {uppy.i18n('logIn')}
      </button>
    )
  }

  return (
    <>
      <button type="button" disabled={loading} onClick={showPicker}>
        {pickerType === 'drive' ?
          uppy.i18n('pickFiles')
        : uppy.i18n('pickPhotos')}
      </button>
      <button type="button" disabled={loading} onClick={handleSignoutClick}>
        {uppy.i18n('logOut')}
      </button>
    </>
  )
}
