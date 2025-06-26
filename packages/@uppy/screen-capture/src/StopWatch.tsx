import { Component, h } from 'preact'

type $TSFixMe = any

function fmtMSS(s: number) {
  // biome-ignore lint/suspicious/noAssignInExpressions: ...
  return (s - (s %= 60)) / 60 + (s > 9 ? ':' : ':0') + s
}

class StopWatch extends Component {
  private wrapperStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
  } as const

  private overlayStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: 'black',
    opacity: 0.7,
  } as const

  private infoContainerStyle = {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
    zIndex: 1,
    color: 'white',
  } as const

  private infotextStyle = {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: '1rem',
    fontSize: '1.5rem',
  } as const

  private timeStyle = {
    display: 'block',
    fontWeight: 'bold',
    marginLeft: 'auto',
    marginRight: 'auto',
    fontSize: '3rem',
    fontFamily: 'Courier New',
  } as const

  private timerRunning: boolean = false

  private timer?: ReturnType<typeof setTimeout>

  constructor(props: $TSFixMe) {
    super(props)
    this.state = { elapsedTime: 0 }
  }

  startTimer() {
    this.timerTick()
    this.timerRunning = true
  }

  resetTimer() {
    clearTimeout(this.timer)
    this.setState({ elapsedTime: 0 })
    this.timerRunning = false
  }

  timerTick() {
    this.timer = setTimeout(() => {
      this.setState((state: $TSFixMe) => ({
        elapsedTime: state.elapsedTime + 1,
      }))
      this.timerTick()
    }, 1000)
  }

  render() {
    const { recording, i18n } = { ...this.props } as $TSFixMe
    const { elapsedTime } = this.state as $TSFixMe

    // second to minutes and seconds
    const minAndSec = fmtMSS(elapsedTime)

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
            <div style={this.infotextStyle}>{i18n('recording')}</div>
            <div style={this.timeStyle}>{minAndSec}</div>
          </div>
        </div>
      )
    }
    return null
  }
}

export default StopWatch
