// Parent
import Plugin from './Plugin'

// Orchestrators
import Dashboard from './Dashboard/index.js'

// Acquirers
import Dummy from './Dummy'
import DragDrop from './DragDrop/index.js'
import Formtag from './Formtag'
import GoogleDrive from './GoogleDrive/index.js'
import Webcam from './Webcam/index.js'

// Progressindicators
import ProgressBar from './ProgressBar.js'
import Informer from './Informer.js'
// import Spinner from './Spinner'

// Uploaders
import Tus10 from './Tus10'
import Multipart from './Multipart'

// Presenters
// import Present from './Present'

// Presetters
// import TransloaditBasic from './TransloaditBasic'

export default {
  Plugin,
  Dummy,
  ProgressBar,
  Informer,
  DragDrop,
  GoogleDrive,
  Formtag,
  Tus10,
  Multipart,
  // TransloaditBasic,
  Dashboard,
  Webcam
}
