import * as box from './box.js'
import * as constants from './constants.js'
import * as drive from './drive.js'
import * as dropbox from './dropbox.js'
import * as facebook from './facebook.js'
import * as onedrive from './onedrive.js'
import * as zoom from './zoom.js'

export const providers = {
  box,
  drive,
  dropbox,
  onedrive,
  facebook,
  zoom,
} as const

export const defaults = constants
