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

    this.timeStyle = {
      color: 'white',
      fontWeight: 'bold',
      marginLeft: 'auto',
      marginRight: 'auto',
      marginTop: 'auto',
      marginBottom: 'auto',
      zIndex: 1,
      fontSize: '3rem',
      fontFamily: 'Courier New'
    }
  }

  componentDidMount () {

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

  fmtMSS (s) { return (s - (s %= 60)) / 60 + (s > 9 ? ':' : ':0') + s }

  render () {
    const { recording } = { ...this.props }

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
          <div style={this.timeStyle}>
            {minAndSec}
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

module.exports = Stopwatch
