import Uppy from '@uppy/core'
import StatusBar from '..'

{
  const uppy = new Uppy()
  uppy.use(StatusBar, {
    target: 'body',
    showProgressDetails: true,
    hideUploadButton: false,
    hideAfterFinish: false,
    hideRetryButton: false,
    hidePauseResumeButton: false,
    hideCancelButton: false,
    doneButtonHandler: () => {
      // something
    },
    locale: {
      strings: {
        uploading: '',
        upload: '',
        complete: '',
        uploadFailed: '',
        paused: '',
        retry: '',
        retryUpload: '',
        cancel: '',
        pause: '',
        resume: '',
        done: '',
        filesUploadedOfTotal: '',
        dataUploadedOfTotal: '',
        xTimeLeft: '',
        uploadXFiles: '',
        uploadXNewFiles: '',
        xMoreFilesAdded: '',
      },
    },
  })
}
