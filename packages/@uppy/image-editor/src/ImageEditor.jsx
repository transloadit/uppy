import { UIPlugin } from '@uppy/core'
import { h } from 'preact'

import Editor from './Editor.jsx'
import packageJson from '../package.json'
import locale from './locale.js'

export default class ImageEditor extends UIPlugin {
  static VERSION = packageJson.version

  constructor (uppy, opts) {
    super(uppy, opts)
    this.id = this.opts.id || 'ImageEditor'
    this.title = 'Image Editor'
    this.type = 'editor'

    this.defaultLocale = locale

    const defaultCropperOptions = {
      viewMode: 1,
      background: false,
      autoCropArea: 1,
      responsive: true,
      croppedCanvasOptions: {},
    }

    const defaultActions = {
      revert: true,
      rotate: true,
      granularRotate: true,
      flip: true,
      zoomIn: true,
      zoomOut: true,
      cropSquare: true,
      cropWidescreen: true,
      cropWidescreenVertical: true,
    }

    const defaultOptions = {
      quality: 0.8,
    }

    this.opts = {
      ...defaultOptions,
      ...opts,
      actions: {
        ...defaultActions,
        ...opts.actions,
      },
      cropperOptions: {
        ...defaultCropperOptions,
        ...opts.cropperOptions,
      },
    }

    this.i18nInit()
  }

  // eslint-disable-next-line class-methods-use-this
  canEditFile (file) {
    if (!file.type || file.isRemote) {
      return false
    }

    const fileTypeSpecific = file.type.split('/')[1]

    if (/^(jpe?g|gif|png|bmp|webp)$/.test(fileTypeSpecific)) {
      return true
    }

    return false
  }

  save = () => {
    const saveBlobCallback = (blob) => {
      const { currentImage } = this.getPluginState()

      this.uppy.setFileState(currentImage.id, {
        data: blob,
        size: blob.size,
        preview: null,
      })

      const updatedFile = this.uppy.getFile(currentImage.id)
      this.uppy.emit('thumbnail:request', updatedFile)
      this.setPluginState({
        currentImage: updatedFile,
      })
      this.uppy.emit('file-editor:complete', updatedFile)
    }

    const { currentImage } = this.getPluginState()

    this.cropper.getCroppedCanvas(this.opts.cropperOptions.croppedCanvasOptions).toBlob(
      saveBlobCallback,
      currentImage.type,
      this.opts.quality,
    )
  }

  storeCropperInstance = (cropper) => {
    this.cropper = cropper
  }

  selectFile = (file) => {
    isFileContentAnImageType(file)
      .then(() => {
        this.uppy.emit('file-editor:start', file)
        this.setPluginState({
          currentImage: file,
        })
      })
      .catch(() => {
        // do error handling
        // logs, callbacks etc...
      })
  }

  install () {
    this.setPluginState({
      currentImage: null,
    })

    const { target } = this.opts
    if (target) {
      this.mount(target, this)
    }
  }

  uninstall () {
    const { currentImage } = this.getPluginState()

    if (currentImage) {
      const file = this.uppy.getFile(currentImage.id)
      this.uppy.emit('file-editor:cancel', file)
    }
    this.unmount()
  }

  render () {
    const { currentImage } = this.getPluginState()

    if (currentImage === null || currentImage.isRemote) {
      return null
    }

    return (
      <Editor
        currentImage={currentImage}
        storeCropperInstance={this.storeCropperInstance}
        save={this.save}
        opts={this.opts}
        i18n={this.i18n}
      />
    )
  }
}

const isFileContentAnImageType = (file) => {
  // ref: https://stackoverflow.com/questions/18299806/how-to-check-file-mime-type-with-javascript-before-upload
  return new Promise((resolve, reject) => {
    // get first 4 bytes of the file
    const blob = file.data.slice(0, 4);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        // convert content to a unsigned int array to read it's value
        // then toString(16) converts to hexadecimal
        const initialBytesOfFile = new Uint8Array(reader.result)
                                .reduce((prev, curr ) => prev + curr.toString(16), "");
        /*
          compare initialBytesOfFile with magic numbers to identify file signature
          file signatures reference: https://en.wikipedia.org/wiki/List_of_file_signatures
        */
        switch (initialBytesOfFile) {
          // image/png
          case "89504e47":
            resolve(true);
            break;
          // image/jpeg or image/jpg
          case "ffd8ffe0":
          case "ffd8ffe1":
          case "ffd8ffdb":
          case "ffd8ffee":
            resolve(true);
            break;
        }
        reject();
      }
    };
    reader.readAsArrayBuffer(blob);
  });
};
