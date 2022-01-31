import 'dotenv/config'
import nodemon from 'nodemon'

nodemon({
  watch: 'packages/@uppy/companion/src',
  exec: 'node packages/@uppy/companion/src/standalone/start-server.js',
})
