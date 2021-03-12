const { h, Component } = require('preact')

class Stopwatch extends Component {
  constructor (props) {
    super(props)
    this.state = { elapsedTime: 0 }

    this.wrapperStyle = {
      width: '100%',
      height: '100%',
      display: 'flex'
    }

    this.overlayStyle = {
      position: 'absolute',
      width: '100%',
      height: '100%',
      background: 'black',
      opacity: 0.7
    }

    this.infoContainerStyle = {
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: 'auto',
      marginBottom: 'auto',
      zIndex: 1,
      color: 'white'
    }

    this.infotextStyle = {
      marginLeft: 'auto',
      marginRight: 'auto',
      marginBottom: '1rem',
      fontSize: '1.5rem'
    }

    this.timeStyle = {
      display: 'block',
      fontWeight: 'bold',
      marginLeft: 'auto',
      marginRight: 'auto',
      fontSize: '3rem',
      fontFamily: 'Courier New'
    }
  }

  startTimer () {
    this.timerTick()
    this.timerRunning = true
  }

  resetTimer () {
    clearTimeout(this.timer)
    this.setState({ elapsedTime: 0 })
    this.timerRunning = false
  }

  timerTick () {
    this.timer = setTimeout(() => {
      this.setState({ elapsedTime: this.state.elapsedTime + 1 })
      this.timerTick()
    }, 1000)
  }

  fmtMSS (s) {
    return (s - (s %= 60)) / 60 + (s > 9 ? ':' : ':0') + s
  }

  render () {
    const { recording, i18n } = { ...this.props }

    // second to minutes and seconds
    const minAndSec = this.fmtMSS(this.state.elapsedTime)

    if (recording && !this.timerRunning) {
      this.startTimer()
    }

    if (!recording && this.timerRunning) {
      this.resetTimer()
    }

    if (recording) {
      return (
        <div style={this.wrapperStyle}>
          <div style={this.overlayStyle} />
          <div style={this.infoContainerStyle}>
            <div style={this.infotextStyle}>
              {i18n('recording')}
            </div>
            <div style={this.timeStyle}>
              {minAndSec}
            </div>
          </div>

        </div>
      )
    } else {
      return null
    }
  }
}

module.exports = Stopwatch
