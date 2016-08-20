// Parent
import Plugin from './Plugin'

// Orchestrators
import Dashboard from './Dashboard/index.js'

// Acquirers
import Dummy from './Dummy'
import DragDrop from './DragDrop'
import Formtag from './Formtag'
import GoogleDrive from './GoogleDrive/index.js'

// Progressindicators
import ProgressBar from './ProgressBar'
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
  // Spinner,
  // Present,
  DragDrop,
  GoogleDrive,
  Formtag,
  Tus10,
  Multipart,
  // TransloaditBasic,
  Dashboard
}
