import Uppy = require('@uppy/core');
import Webcam = require('../');

{
  Uppy().use(Webcam, {
    modes: ['video-only']
  });
}
