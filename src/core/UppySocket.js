export default class UppySocket {
  constructor (opts) {
    this.isOpen = false
    this.socket = new WebSocket(opts.target)

    this.socket.onopen = (e) => {
      this.emit('google:get', {
        fileId: '1uPumltHjPmC57_Ljc5onxmtpHziDdId7WDKU9biBV7g',
        target: 'api2.transloadit.com'
      })
    }

    this.socket.onmessage = (e) => {
      console.log(e.data)
    }

    this.emit = this.emit.bind(this)
  }

  emit (action, payload) {
    this.socket.send(JSON.stringify({
      action,
      payload
    }))
  }
}
