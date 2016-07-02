// Parent
import Plugin from './Plugin'

// Orchestrators
import Modal from './Modal'
import Dashboard from './Dashboard'

// Acquirers
import Dummy from './Dummy'
import DragDrop from './DragDrop'
import Dropbox from './Dropbox'
import Formtag from './Formtag'
import GoogleDrive from './GoogleDrive'

// Progressindicators
import ProgressBar from './ProgressBar'
import Spinner from './Spinner'

// Uploaders
import Tus10 from './Tus10'
import Multipart from './Multipart'

// Presenters
import Present from './Present'

// Presetters
import TransloaditBasic from './TransloaditBasic'

module.exports = {
  Plugin,
  Dummy,
  ProgressBar,
  Spinner,
  Present,
  DragDrop,
  Dropbox,
  GoogleDrive,
  Formtag,
  Tus10,
  Multipart,
  TransloaditBasic,
  Modal,
  Dashboard
}
