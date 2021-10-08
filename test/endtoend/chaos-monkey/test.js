/* global browser, expect  */
const crypto = require('crypto')
const lorem = require('@jamen/lorem')
const { selectFakeFile } = require('../utils')

const testURL = 'http://localhost:4567/chaos-monkey'

describe('Chaos monkey', function test () {
  this.timeout(5 * 60 * 1000) // 5 minutes

  beforeEach(async () => {
    await browser.url(testURL)
  })

  it('Add and cancel a bunch', async () => {
    await browser.execute(() => {
      window.currentUppy = window.setup({ limit: 3 })
      window.onerror = (message) => {
        window.anyError = message
      }
    })

    const types = ['application/octet-stream', 'text/plain']
    const generate = {
      'application/octet-stream' () {
        const len = Math.round(Math.random() * 5000000)
        return crypto.randomBytes(len)
      },
      'text/plain' () {
        const len = Math.round(Math.random() * 5000000)
        return Buffer.from(lorem(len))
      },
    }

    async function addFile () {
      await browser.execute(() => {
        window.addLogMessage('Adding a file')
      })
      const type = types[Math.floor(Math.random() * types.length)]
      const data = generate[type]().toString('base64')

      const name = `${Math.random().toString(32).slice(2)}-file`
      await browser.execute(selectFakeFile, 'currentUppy', name, type, data)
    }

    function cancelFile () {
      return browser.execute(() => {
        window.addLogMessage('Cancelling a file')
        // prefer deleting a file that is uploading right now
        const selector = Math.random() <= 0.7
          ? '.is-inprogress .uppy-Dashboard-Item-action--remove'
          : '.uppy-Dashboard-Item-action--remove'
        const buttons = document.querySelectorAll(selector)
        const del = buttons[Math.floor(Math.random() * buttons.length)]
        if (del) del.click()
      })
    }

    function startUploadIfAnyWaitingFiles () {
      return browser.execute(() => {
        window.addLogMessage('Starting upload')
        const start = document.querySelector('.uppy-StatusBar-actionBtn--upload')
        if (start) start.click()
      })
    }

    function cancelAll () {
      return browser.execute(() => {
        window.addLogMessage('Cancelling everything')
        const button = document.querySelector('.uppy-DashboardContent-back')
        if (button) button.click()
      })
    }

    await addFile()
    await addFile()
    await addFile()

    for (let i = 0; i < 300; i++) {
      await browser.pause(50 + Math.floor(Math.random() * 300))
      const v = Math.floor(Math.random() * 100)
      if (v < 45) {
        await addFile()
      } else if (v < 55) {
        await cancelFile()
      } else if (v === 55) {
        await cancelAll()
      } else if (v < 75) {
        await startUploadIfAnyWaitingFiles()
      } else {
        // wait
      }
    }

    await cancelAll()

    const errorMessage = await browser.execute(() => {
      return window.anyError
    })
    // yikes chai, why can this not be a function call
    expect(errorMessage).to.not.exist // eslint-disable-line no-unused-expressions
  })
})
