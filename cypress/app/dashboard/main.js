import { Uppy } from '@uppy/core'
import Dashboard from '@uppy/dashboard'

new Uppy().use(Dashboard, { target: '#app', inline: true })
