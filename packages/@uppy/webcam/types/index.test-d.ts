import Uppy = require('@uppy/core')
import Webcam = require('../')

{
  Uppy<Uppy.StrictTypes>().use(Webcam, {
    modes: ['video-only']
  })
}
