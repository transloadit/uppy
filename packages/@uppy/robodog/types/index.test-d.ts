import { Transloadit } from 'uppy' // eslint-disable-line import/no-extraneous-dependencies
import { expectError } from 'tsd'
import Robodog from '.'

/* eslint-disable @typescript-eslint/no-unused-vars */

async function performPick () {
  const { successful, failed, transloadit, results } = await Robodog.pick({
    target: 'test',
    errorReporting: true,
    waitForEncoding: false,
    waitForMetadata: false,
    animateOpenClose: true,
    inline: false,
    params: {
      auth: { key: '' },
      template_id: '',
    },
    providers: ['webcam', 'url'],
    webcam: {
      countdown: false,
      modes: [
        'video-audio',
        'video-only',
        'audio-only',
        'picture',
      ],
      mirror: true,
    },
    url: {
      companionUrl: Transloadit.COMPANION,
    },
  })
}

const instance = Robodog.form('string', {
  submitOnSuccess: true,
  triggerUploadOnSubmit: false,
  params: {
    auth: { key: '' },
    template_id: '',
  },
  modal: true,
  closeAfterFinish: true,
  statusbar: 'target',
})

// should not have access to omitted form settings
expectError(Robodog.form('string', {
  addResultToForm: false,
}))

// target is required
expectError(Robodog.form({
  addResultToForm: false,
}))

const files: File[] = []

const upload = Robodog.upload(files, {
  debug: true,
  errorReporting: true,
  params: {
    auth: { key: '' },
    template_id: '',
  },
})

// Files array is required
expectError(Robodog.upload({ debug: true }))

const dashboard = Robodog.dashboard('selector', {
  debug: true,
  errorReporting: true,
  params: {
    auth: { key: '' },
    template_id: '',
  },
})
  .on('transloadit:result', (result) => {
    console.log(result)
  })

// selector is required
expectError(Robodog.dashboard({ }))
