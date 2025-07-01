// biome-ignore lint/complexity/noBannedTypes: ...
function isFunction(v: any): v is Function {
  return typeof v === 'function'
}

function result<T>(v: T | (() => T)): T {
  return isFunction(v) ? v() : v
}

type MaybeFunction<T> = T | (() => T)

interface AudioOscilloscopeOptions {
  canvas?: {
    width?: number
    height?: number
  }
  canvasContext?: {
    width?: MaybeFunction<number>
    height?: MaybeFunction<number>
    lineWidth?: MaybeFunction<number>
    fillStyle?: MaybeFunction<string>
    strokeStyle?: MaybeFunction<string>
  }

  onDrawFrame?: (oscilloscope: AudioOscilloscope) => void
}

/* Audio Oscilloscope
  https://github.com/miguelmota/audio-oscilloscope
*/
export default class AudioOscilloscope {
  private canvas: HTMLCanvasElement

  private canvasContext: CanvasRenderingContext2D

  private width: number

  private height: number

  private analyser: null | AnalyserNode

  private bufferLength: number

  private dataArray?: Uint8Array

  private onDrawFrame: (oscilloscope: AudioOscilloscope) => void

  private streamSource?: MediaStreamAudioSourceNode

  private audioContext?: BaseAudioContext

  public source?: AudioBufferSourceNode

  constructor(
    canvas: HTMLCanvasElement,
    options: AudioOscilloscopeOptions = {},
  ) {
    const canvasOptions =
      options.canvas || ({} as NonNullable<AudioOscilloscopeOptions['canvas']>)
    const canvasContextOptions =
      options.canvasContext ||
      ({} as NonNullable<AudioOscilloscopeOptions['canvasContext']>)
    this.analyser = null
    this.bufferLength = 0
    this.canvas = canvas
    this.width = result(canvasOptions.width) || this.canvas.width
    this.height = result(canvasOptions.height) || this.canvas.height
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvasContext = this.canvas.getContext('2d')!
    this.canvasContext.fillStyle =
      result(canvasContextOptions.fillStyle) || 'rgb(255, 255, 255)'
    this.canvasContext.strokeStyle =
      result(canvasContextOptions.strokeStyle) || 'rgb(0, 0, 0)'
    this.canvasContext.lineWidth = result(canvasContextOptions.lineWidth) || 1
    this.onDrawFrame = isFunction(options.onDrawFrame)
      ? options.onDrawFrame
      : () => {}
  }

  addSource(streamSource: MediaStreamAudioSourceNode): void {
    this.streamSource = streamSource
    this.audioContext = this.streamSource.context
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048
    this.bufferLength = this.analyser.frequencyBinCount
    this.source = this.audioContext.createBufferSource()
    this.dataArray = new Uint8Array(this.bufferLength)
    this.analyser.getByteTimeDomainData(this.dataArray)
    this.streamSource.connect(this.analyser)
  }

  draw(): void {
    const { analyser, dataArray, bufferLength } = this
    const ctx = this.canvasContext
    const w = this.width
    const h = this.height

    if (analyser) {
      analyser.getByteTimeDomainData(dataArray!)
    }

    ctx.fillRect(0, 0, w, h)
    ctx.beginPath()

    const sliceWidth = (w * 1.0) / bufferLength
    let x = 0

    if (!bufferLength) {
      ctx.moveTo(0, this.height / 2)
    }

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray![i] / 128.0
      const y = v * (h / 2)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(w, h / 2)
    ctx.stroke()

    this.onDrawFrame(this)
    requestAnimationFrame(this.#draw)
  }

  #draw = () => this.draw()
}
