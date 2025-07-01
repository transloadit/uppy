import type { Body, Meta, UppyFile } from '@uppy/core'
import type { I18n } from '@uppy/utils/lib/Translator'
import Cropper from 'cropperjs'
import { Component, h } from 'preact'
import type ImageEditor from './ImageEditor.js'
import getCanvasDataThatFitsPerfectlyIntoContainer from './utils/getCanvasDataThatFitsPerfectlyIntoContainer.js'
import getScaleFactorThatRemovesDarkCorners from './utils/getScaleFactorThatRemovesDarkCorners.js'
import limitCropboxMovementOnMove from './utils/limitCropboxMovementOnMove.js'
import limitCropboxMovementOnResize from './utils/limitCropboxMovementOnResize.js'

type Props<M extends Meta, B extends Body> = {
  currentImage: UppyFile<M, B>
  storeCropperInstance: (cropper: Cropper) => void
  opts: ImageEditor<M, B>['opts']
  i18n: I18n
  save: () => void
}

type State = {
  angle90Deg: number
  angleGranular: number
  prevCropboxData: Cropper.CropBoxData | null
}

export default class Editor<M extends Meta, B extends Body> extends Component<
  Props<M, B>,
  State
> {
  imgElement!: HTMLImageElement

  cropper!: Cropper

  constructor(props: Props<M, B>) {
    super(props)
    this.state = {
      angle90Deg: 0,
      angleGranular: 0,
      prevCropboxData: null,
    }
    this.storePrevCropboxData = this.storePrevCropboxData.bind(this)
    this.limitCropboxMovement = this.limitCropboxMovement.bind(this)
  }

  componentDidMount(): void {
    const { opts, storeCropperInstance } = this.props
    this.cropper = new Cropper(this.imgElement, opts.cropperOptions)

    this.imgElement.addEventListener('cropstart', this.storePrevCropboxData)
    // @ts-expect-error custom cropper event but DOM API does not understand
    this.imgElement.addEventListener('cropend', this.limitCropboxMovement)

    storeCropperInstance(this.cropper)
  }

  componentWillUnmount(): void {
    this.cropper.destroy()

    this.imgElement.removeEventListener('cropstart', this.storePrevCropboxData)
    // @ts-expect-error custom cropper event but DOM API does not understand
    this.imgElement.removeEventListener('cropend', this.limitCropboxMovement)
  }

  storePrevCropboxData(): void {
    this.setState({ prevCropboxData: this.cropper.getCropBoxData() })
  }

  limitCropboxMovement(event: { detail: { action: string } }): void {
    const canvasData = this.cropper.getCanvasData()
    const cropboxData = this.cropper.getCropBoxData()
    const { prevCropboxData } = this.state

    // 1. When we grab the cropbox in the middle and move it
    if (event.detail.action === 'all') {
      const newCropboxData = limitCropboxMovementOnMove(
        canvasData,
        cropboxData,
        prevCropboxData!,
      )
      if (newCropboxData) this.cropper.setCropBoxData(newCropboxData)
      // 2. When we stretch the cropbox by one of its sides
    } else {
      const newCropboxData = limitCropboxMovementOnResize(
        canvasData,
        cropboxData,
        prevCropboxData!,
      )
      if (newCropboxData) this.cropper.setCropBoxData(newCropboxData)
    }
  }

  onRotate90Deg = (): void => {
    // 1. Set state
    const { angle90Deg } = this.state
    const newAngle = angle90Deg - 90
    this.setState({
      angle90Deg: newAngle,
      angleGranular: 0,
    })

    // 2. Rotate the image
    // Important to reset scale here, or cropper will get confused on further rotations
    this.cropper.scale(1)
    this.cropper.rotateTo(newAngle)

    // 3. Fit the rotated image into the view
    const canvasData = this.cropper.getCanvasData()
    const containerData = this.cropper.getContainerData()
    const newCanvasData = getCanvasDataThatFitsPerfectlyIntoContainer(
      containerData,
      canvasData,
    )
    this.cropper.setCanvasData(newCanvasData)

    // 4. Make cropbox fully wrap the image
    this.cropper.setCropBoxData(newCanvasData)
  }

  onRotateGranular = (ev: Event): void => {
    // 1. Set state
    const newGranularAngle = Number((ev.target as HTMLInputElement).value)
    this.setState({ angleGranular: newGranularAngle })

    // 2. Rotate the image
    const { angle90Deg } = this.state
    const newAngle = angle90Deg + newGranularAngle
    this.cropper.rotateTo(newAngle)

    // 3. Scale the image so that it fits into the cropbox
    const image = this.cropper.getImageData()
    const scaleFactor = getScaleFactorThatRemovesDarkCorners(
      image.naturalWidth,
      image.naturalHeight,
      newGranularAngle,
    )
    // Preserve flip
    const scaleFactorX =
      this.cropper.getImageData().scaleX < 0 ? -scaleFactor : scaleFactor
    this.cropper.scale(scaleFactorX, scaleFactor)
  }

  renderGranularRotate() {
    const { i18n } = this.props
    const { angleGranular } = this.state

    return (
      <label
        role="tooltip"
        aria-label={`${angleGranular}º`}
        data-microtip-position="top"
        className="uppy-ImageCropper-rangeWrapper"
      >
        <input
          className="uppy-ImageCropper-range uppy-u-reset"
          type="range"
          onInput={this.onRotateGranular}
          onChange={this.onRotateGranular}
          value={angleGranular}
          min="-45"
          max="45"
          aria-label={i18n('rotate')}
        />
      </label>
    )
  }

  renderRevert() {
    const { i18n, opts } = this.props

    return (
      <button
        data-microtip-position="top"
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('revert')}
        onClick={() => {
          this.cropper.reset()
          this.cropper.setAspectRatio(
            opts.cropperOptions.initialAspectRatio as number,
          )
          this.setState({ angle90Deg: 0, angleGranular: 0 })
        }}
      >
        <svg
          aria-hidden="true"
          className="uppy-c-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
      </button>
    )
  }

  renderRotate() {
    const { i18n } = this.props

    return (
      <button
        data-microtip-position="top"
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('rotate')}
        onClick={this.onRotate90Deg}
      >
        <svg
          aria-hidden="true"
          className="uppy-c-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none" />
          <path d="M14 10a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2h8zm0 1.75H6a.25.25 0 00-.243.193L5.75 12v7a.25.25 0 00.193.243L6 19.25h8a.25.25 0 00.243-.193L14.25 19v-7a.25.25 0 00-.193-.243L14 11.75zM12 .76V4c2.3 0 4.61.88 6.36 2.64a8.95 8.95 0 012.634 6.025L21 13a1 1 0 01-1.993.117L19 13h-.003a6.979 6.979 0 00-2.047-4.95 6.97 6.97 0 00-4.652-2.044L12 6v3.24L7.76 5 12 .76z" />
        </svg>
      </button>
    )
  }

  renderFlip() {
    const { i18n } = this.props

    return (
      <button
        data-microtip-position="top"
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('flipHorizontal')}
        onClick={() =>
          this.cropper.scaleX(-this.cropper.getData().scaleX || -1)
        }
      >
        <svg
          aria-hidden="true"
          className="uppy-c-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M15 21h2v-2h-2v2zm4-12h2V7h-2v2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2zm16-2v2h2c0-1.1-.9-2-2-2zm-8 20h2V1h-2v22zm8-6h2v-2h-2v2zM15 5h2V3h-2v2zm4 8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2z" />
        </svg>
      </button>
    )
  }

  renderZoomIn() {
    const { i18n } = this.props

    return (
      <button
        data-microtip-position="top"
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('zoomIn')}
        onClick={() => this.cropper.zoom(0.1)}
      >
        <svg
          aria-hidden="true"
          className="uppy-c-icon"
          height="24"
          viewBox="0 0 24 24"
          width="24"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" />
        </svg>
      </button>
    )
  }

  renderZoomOut() {
    const { i18n } = this.props

    return (
      <button
        data-microtip-position="top"
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('zoomOut')}
        onClick={() => this.cropper.zoom(-0.1)}
      >
        <svg
          aria-hidden="true"
          className="uppy-c-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z" />
        </svg>
      </button>
    )
  }

  renderCropSquare() {
    const { i18n } = this.props

    return (
      <button
        data-microtip-position="top"
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('aspectRatioSquare')}
        onClick={() => this.cropper.setAspectRatio(1)}
      >
        <svg
          aria-hidden="true"
          className="uppy-c-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        </svg>
      </button>
    )
  }

  renderCropWidescreen() {
    const { i18n } = this.props

    return (
      <button
        data-microtip-position="top"
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('aspectRatioLandscape')}
        onClick={() => this.cropper.setAspectRatio(16 / 9)}
      >
        <svg
          aria-hidden="true"
          className="uppy-c-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M 19,4.9999992 V 17.000001 H 4.9999998 V 6.9999992 H 19 m 0,-2 H 4.9999998 c -1.0999999,0 -1.9999999,0.9000001 -1.9999999,2 V 17.000001 c 0,1.1 0.9,2 1.9999999,2 H 19 c 1.1,0 2,-0.9 2,-2 V 6.9999992 c 0,-1.0999999 -0.9,-2 -2,-2 z" />
          <path fill="none" d="M0 0h24v24H0z" />
        </svg>
      </button>
    )
  }

  renderCropWidescreenVertical() {
    const { i18n } = this.props

    return (
      <button
        data-microtip-position="top"
        type="button"
        aria-label={i18n('aspectRatioPortrait')}
        className="uppy-u-reset uppy-c-btn"
        onClick={() => this.cropper.setAspectRatio(9 / 16)}
      >
        <svg
          aria-hidden="true"
          className="uppy-c-icon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
        >
          <path d="M 19.000001,19 H 6.999999 V 5 h 10.000002 v 14 m 2,0 V 5 c 0,-1.0999999 -0.9,-1.9999999 -2,-1.9999999 H 6.999999 c -1.1,0 -2,0.9 -2,1.9999999 v 14 c 0,1.1 0.9,2 2,2 h 10.000002 c 1.1,0 2,-0.9 2,-2 z" />
          <path d="M0 0h24v24H0z" fill="none" />
        </svg>
      </button>
    )
  }

  render() {
    const { currentImage, opts } = this.props
    const { actions } = opts
    const imageURL = URL.createObjectURL(currentImage.data)

    return (
      <div className="uppy-ImageCropper">
        <div className="uppy-ImageCropper-container">
          <img
            className="uppy-ImageCropper-image"
            alt={currentImage.name}
            src={imageURL}
            ref={(ref) => {
              this.imgElement = ref as HTMLImageElement
            }}
          />
        </div>

        <div className="uppy-ImageCropper-controls">
          {actions.revert && this.renderRevert()}
          {actions.rotate && this.renderRotate()}
          {actions.granularRotate && this.renderGranularRotate()}
          {actions.flip && this.renderFlip()}
          {actions.zoomIn && this.renderZoomIn()}
          {actions.zoomOut && this.renderZoomOut()}
          {actions.cropSquare && this.renderCropSquare()}
          {actions.cropWidescreen && this.renderCropWidescreen()}
          {actions.cropWidescreenVertical &&
            this.renderCropWidescreenVertical()}
        </div>
      </div>
    )
  }
}
