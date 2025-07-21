import type {
  Body,
  DefinePluginOpts,
  Meta,
  State,
  Uppy,
  UppyFile,
} from '@uppy/core'
import { UIPlugin } from '@uppy/core'
import emaFilter from '@uppy/utils/lib/emaFilter'
import getTextDirection from '@uppy/utils/lib/getTextDirection'
import type { ComponentChild } from 'preact'
import { h } from 'preact'
import packageJson from '../package.json' with { type: 'json' }
import locale from './locale.js'
import type { StatusBarOptions } from './StatusBarOptions.js'
import statusBarStates from './StatusBarStates.js'
import StatusBarUI, { type StatusBarUIProps } from './StatusBarUI.js'

const speedFilterHalfLife = 2000
const ETAFilterHalfLife = 2000

function getUploadingState(
  error: unknown,
  isAllComplete: boolean,
  recoveredState: any,
  files: Record<string, UppyFile<any, any>>,
): StatusBarUIProps<any, any>['uploadState'] {
  if (error) {
    return statusBarStates.STATE_ERROR
  }

  if (isAllComplete) {
    return statusBarStates.STATE_COMPLETE
  }

  if (recoveredState) {
    return statusBarStates.STATE_WAITING
  }

  let state: StatusBarUIProps<any, any>['uploadState'] =
    statusBarStates.STATE_WAITING
  const fileIDs = Object.keys(files)
  for (let i = 0; i < fileIDs.length; i++) {
    const { progress } = files[fileIDs[i]]
    // If ANY files are being uploaded right now, show the uploading state.
    if (progress.uploadStarted && !progress.uploadComplete) {
      return statusBarStates.STATE_UPLOADING
    }
    // If files are being preprocessed AND postprocessed at this time, we show the
    // preprocess state. If any files are being uploaded we show uploading.
    if (progress.preprocess) {
      state = statusBarStates.STATE_PREPROCESSING
    }
    // If NO files are being preprocessed or uploaded right now, but some files are
    // being postprocessed, show the postprocess state.
    if (progress.postprocess && state !== statusBarStates.STATE_PREPROCESSING) {
      state = statusBarStates.STATE_POSTPROCESSING
    }
  }
  return state
}

const defaultOptions = {
  hideUploadButton: false,
  hideRetryButton: false,
  hidePauseResumeButton: false,
  hideCancelButton: false,
  showProgressDetails: false,
  hideAfterFinish: true,
  doneButtonHandler: null,
} satisfies StatusBarOptions

/**
 * StatusBar: renders a status bar with upload/pause/resume/cancel/retry buttons,
 * progress percentage and time remaining.
 */
export default class StatusBar<M extends Meta, B extends Body> extends UIPlugin<
  DefinePluginOpts<StatusBarOptions, keyof typeof defaultOptions>,
  M,
  B
> {
  static VERSION = packageJson.version

  #lastUpdateTime!: ReturnType<typeof performance.now>

  #previousUploadedBytes!: number | null

  #previousSpeed!: number | null

  #previousETA!: number | null

  constructor(uppy: Uppy<M, B>, opts?: StatusBarOptions) {
    super(uppy, { ...defaultOptions, ...opts })
    this.id = this.opts.id || 'StatusBar'
    this.title = 'StatusBar'
    this.type = 'progressindicator'

    this.defaultLocale = locale

    this.i18nInit()

    this.render = this.render.bind(this)
    this.install = this.install.bind(this)
  }

  #computeSmoothETA(totalBytes: {
    uploaded: number
    total: number | null // null means indeterminate
  }) {
    if (totalBytes.total == null || totalBytes.total === 0) {
      return null
    }

    const remaining = totalBytes.total - totalBytes.uploaded
    if (remaining <= 0) {
      return null
    }

    // When state is restored, lastUpdateTime is still nullish at this point.
    this.#lastUpdateTime ??= performance.now()
    const dt = performance.now() - this.#lastUpdateTime
    if (dt === 0) {
      return Math.round((this.#previousETA ?? 0) / 100) / 10
    }

    const uploadedBytesSinceLastTick =
      totalBytes.uploaded - this.#previousUploadedBytes!
    this.#previousUploadedBytes = totalBytes.uploaded

    // uploadedBytesSinceLastTick can be negative in some cases (packet loss?)
    // in which case, we wait for next tick to update ETA.
    if (uploadedBytesSinceLastTick <= 0) {
      return Math.round((this.#previousETA ?? 0) / 100) / 10
    }
    const currentSpeed = uploadedBytesSinceLastTick / dt
    const filteredSpeed =
      this.#previousSpeed == null
        ? currentSpeed
        : emaFilter(currentSpeed, this.#previousSpeed, speedFilterHalfLife, dt)
    this.#previousSpeed = filteredSpeed
    const instantETA = remaining / filteredSpeed

    const updatedPreviousETA = Math.max(this.#previousETA! - dt, 0)
    const filteredETA =
      this.#previousETA == null
        ? instantETA
        : emaFilter(instantETA, updatedPreviousETA, ETAFilterHalfLife, dt)
    this.#previousETA = filteredETA
    this.#lastUpdateTime = performance.now()

    return Math.round(filteredETA / 100) / 10
  }

  startUpload = (): ReturnType<Uppy<M, B>['upload']> => {
    return this.uppy.upload().catch((() => {
      // Error logged in Core
    }) as () => undefined)
  }

  render(state: State<M, B>): ComponentChild {
    const {
      capabilities,
      files,
      allowNewUpload,
      totalProgress,
      error,
      recoveredState,
    } = state

    const {
      newFiles,
      startedFiles,
      completeFiles,

      isUploadStarted,
      isAllComplete,
      isAllPaused,
      isUploadInProgress,
      isSomeGhost,
    } = this.uppy.getObjectOfFilesPerState()

    // If some state was recovered, we want to show Upload button/counter
    // for all the files, because in this case it’s not an Upload button,
    // but “Confirm Restore Button”
    const newFilesOrRecovered = recoveredState ? Object.values(files) : newFiles
    const resumableUploads = !!capabilities.resumableUploads
    const supportsUploadProgress = capabilities.uploadProgress !== false

    let totalSize: number | null = null
    let totalUploadedSize = 0

    // Only if all files have a known size, does it make sense to display a total size
    if (
      startedFiles.every(
        (f) => f.progress.bytesTotal != null && f.progress.bytesTotal !== 0,
      )
    ) {
      totalSize = 0
      startedFiles.forEach((file) => {
        totalSize! += file.progress.bytesTotal || 0
        totalUploadedSize += file.progress.bytesUploaded || 0
      })
    } else {
      // however uploaded size we will always have
      startedFiles.forEach((file) => {
        totalUploadedSize += file.progress.bytesUploaded || 0
      })
    }

    const totalETA = this.#computeSmoothETA({
      uploaded: totalUploadedSize,
      total: totalSize,
    })

    return StatusBarUI({
      error,
      uploadState: getUploadingState(
        error,
        isAllComplete,
        recoveredState,
        state.files || {},
      ),
      allowNewUpload,
      totalProgress,
      totalSize,
      totalUploadedSize,
      isAllComplete: false,
      isAllPaused,
      isUploadStarted,
      isUploadInProgress,
      isSomeGhost,
      recoveredState,
      complete: completeFiles.length,
      newFiles: newFilesOrRecovered.length,
      numUploads: startedFiles.length,
      totalETA,
      files,
      i18n: this.i18n,
      uppy: this.uppy,
      startUpload: this.startUpload,
      doneButtonHandler: this.opts.doneButtonHandler,
      resumableUploads,
      supportsUploadProgress,
      showProgressDetails: this.opts.showProgressDetails,
      hideUploadButton: this.opts.hideUploadButton,
      hideRetryButton: this.opts.hideRetryButton,
      hidePauseResumeButton: this.opts.hidePauseResumeButton,
      hideCancelButton: this.opts.hideCancelButton,
      hideAfterFinish: this.opts.hideAfterFinish,
    })
  }

  onMount(): void {
    // Set the text direction if the page has not defined one.
    const element = this.el!
    const direction = getTextDirection(element)
    if (!direction) {
      element.dir = 'ltr'
    }
  }

  #onUploadStart = (): void => {
    const { recoveredState } = this.uppy.getState()

    this.#previousSpeed = null
    this.#previousETA = null
    if (recoveredState) {
      this.#previousUploadedBytes = Object.values(recoveredState.files).reduce(
        (pv, { progress }) => pv + (progress.bytesUploaded as number),
        0,
      )

      // We don't set `#lastUpdateTime` at this point because the upload won't
      // actually resume until the user asks for it.

      this.uppy.emit('restore-confirmed')
      return
    }
    this.#lastUpdateTime = performance.now()
    this.#previousUploadedBytes = 0
  }

  install(): void {
    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
    this.uppy.on('upload', this.#onUploadStart)

    // To cover the use case where the status bar is installed while the upload
    // has started, we set `lastUpdateTime` right away.
    this.#lastUpdateTime = performance.now()
    this.#previousUploadedBytes = this.uppy
      .getFiles()
      .reduce((pv, file) => pv + (file.progress.bytesUploaded as number), 0)
  }

  uninstall(): void {
    this.unmount()
    this.uppy.off('upload', this.#onUploadStart)
  }
}
