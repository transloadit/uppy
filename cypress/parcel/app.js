import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

new Uppy().use(Dashboard, { target: '#app', inline: true })
