import Cropper from 'cropperjs'
import { h, Component } from 'preact'

export default class Editor extends Component {
  constructor (props) {
    super(props)
    this.state = { rotationAngle: 0, rotationDelta: 0 }
  }

  componentDidMount () {
    const { opts, storeCropperInstance } = this.props
    this.cropper = new Cropper(
      this.imgElement,
      opts.cropperOptions,
    )
    storeCropperInstance(this.cropper)

    if (opts.actions.granularRotate) {
      this.imgElement.addEventListener('crop', (ev) => {
        const rotationAngle = ev.detail.rotate
        this.setState({
          rotationAngle,
          // 405 == 360 + 45
          rotationDelta: ((rotationAngle + 405) % 90) - 45,
        })
      })
    }
  }

  componentWillUnmount () {
    this.cropper.destroy()
  }

  granularRotateOnChange = (ev) => {
    const { rotationAngle, rotationDelta } = this.state
    const pendingRotationDelta = Number(ev.target.value) - rotationDelta
    cancelAnimationFrame(this.granularRotateOnInputNextFrame)
    if (pendingRotationDelta !== 0) {
      const pendingRotationAngle = rotationAngle + pendingRotationDelta
      this.granularRotateOnInputNextFrame = requestAnimationFrame(() => {
        this.cropper.rotateTo(pendingRotationAngle)
      })
    }
  }

  renderGranularRotate () {
    const { i18n } = this.props
    const { rotationDelta, rotationAngle } = this.state

    return (
      // eslint-disable-next-line jsx-a11y/label-has-associated-control
      <label
        data-microtip-position="top"
        role="tooltip"
        aria-label={`${rotationAngle}º`}
        className="uppy-ImageCropper-rangeWrapper uppy-u-reset"
      >
        <input
          className="uppy-ImageCropper-range uppy-u-reset"
          type="range"
          onInput={this.granularRotateOnChange}
          onChange={this.granularRotateOnChange}
          value={rotationDelta}
          min="-45"
          max="44"
          aria-label={i18n('rotate')}
        />
      </label>
    )
  }

  renderRevert () {
    const { i18n } = this.props

    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('revert')}
        data-microtip-position="top"
        onClick={() => {
          this.cropper.reset()
          this.cropper.setAspectRatio(0)
        }}
      >
        <svg aria-hidden="true" className="uppy-c-icon" width="24" height="24" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
      </button>
    )
  }

  renderRotate () {
    const { i18n } = this.props

    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        onClick={() => this.cropper.rotate(-90)}
        aria-label={i18n('rotate')}
        data-microtip-position="top"
      >
        <svg aria-hidden="true" className="uppy-c-icon" width="24" height="24" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none" />
          <path d="M14 10a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2h8zm0 1.75H6a.25.25 0 00-.243.193L5.75 12v7a.25.25 0 00.193.243L6 19.25h8a.25.25 0 00.243-.193L14.25 19v-7a.25.25 0 00-.193-.243L14 11.75zM12 .76V4c2.3 0 4.61.88 6.36 2.64a8.95 8.95 0 012.634 6.025L21 13a1 1 0 01-1.993.117L19 13h-.003a6.979 6.979 0 00-2.047-4.95 6.97 6.97 0 00-4.652-2.044L12 6v3.24L7.76 5 12 .76z" />
        </svg>
      </button>
    )
  }

  renderFlip () {
    const { i18n } = this.props

    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('flipHorizontal')}
        data-microtip-position="top"
        onClick={() => this.cropper.scaleX(-this.cropper.getData().scaleX || -1)}
      >
        <svg aria-hidden="true" className="uppy-c-icon" width="24" height="24" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M15 21h2v-2h-2v2zm4-12h2V7h-2v2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2zm16-2v2h2c0-1.1-.9-2-2-2zm-8 20h2V1h-2v22zm8-6h2v-2h-2v2zM15 5h2V3h-2v2zm4 8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2z" />
        </svg>
      </button>
    )
  }

  renderZoomIn () {
    const { i18n } = this.props

    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('zoomIn')}
        data-microtip-position="top"
        onClick={() => this.cropper.zoom(0.1)}
      >
        <svg aria-hidden="true" className="uppy-c-icon" height="24" viewBox="0 0 24 24" width="24">
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" />
        </svg>
      </button>
    )
  }

  renderZoomOut () {
    const { i18n } = this.props

    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('zoomOut')}
        data-microtip-position="top"
        onClick={() => this.cropper.zoom(-0.1)}
      >
        <svg aria-hidden="true" className="uppy-c-icon" width="24" height="24" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z" />
        </svg>
      </button>
    )
  }

  renderCropSquare () {
    const { i18n } = this.props

    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('aspectRatioSquare')}
        data-microtip-position="top"
        onClick={() => this.cropper.setAspectRatio(1)}
      >
        <svg aria-hidden="true" className="uppy-c-icon" width="24" height="24" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        </svg>
      </button>
    )
  }

  renderCropWidescreen () {
    const { i18n } = this.props

    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('aspectRatioLandscape')}
        data-microtip-position="top"
        onClick={() => this.cropper.setAspectRatio(16 / 9)}
      >
        <svg aria-hidden="true" className="uppy-c-icon" width="24" height="24" viewBox="0 0 24 24">
          <path d="M 19,4.9999992 V 17.000001 H 4.9999998 V 6.9999992 H 19 m 0,-2 H 4.9999998 c -1.0999999,0 -1.9999999,0.9000001 -1.9999999,2 V 17.000001 c 0,1.1 0.9,2 1.9999999,2 H 19 c 1.1,0 2,-0.9 2,-2 V 6.9999992 c 0,-1.0999999 -0.9,-2 -2,-2 z" />
          <path fill="none" d="M0 0h24v24H0z" />
        </svg>
      </button>
    )
  }

  renderCropWidescreenVertical () {
    const { i18n } = this.props

    return (
      <button
        type="button"
        className="uppy-u-reset uppy-c-btn"
        aria-label={i18n('aspectRatioPortrait')}
        data-microtip-position="top"
        onClick={() => this.cropper.setAspectRatio(9 / 16)}
      >
        <svg aria-hidden="true" className="uppy-c-icon" width="24" height="24" viewBox="0 0 24 24">
          <path d="M 19.000001,19 H 6.999999 V 5 h 10.000002 v 14 m 2,0 V 5 c 0,-1.0999999 -0.9,-1.9999999 -2,-1.9999999 H 6.999999 c -1.1,0 -2,0.9 -2,1.9999999 v 14 c 0,1.1 0.9,2 2,2 h 10.000002 c 1.1,0 2,-0.9 2,-2 z" />
          <path d="M0 0h24v24H0z" fill="none" />
        </svg>
      </button>
    )
  }

  render () {
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
            ref={ref => { this.imgElement = ref }}
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
          {actions.cropWidescreenVertical && this.renderCropWidescreenVertical()}
        </div>
      </div>
    )
  }
}
