import type { I18n } from '@uppy/utils/lib/Translator'
import { h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import AudioSourceSelect, {
  type AudioSourceSelectProps,
} from './AudioSourceSelect.js'
import AudioOscilloscope from './audio-oscilloscope/index.js'
import DiscardButton from './DiscardButton.js'
import RecordButton from './RecordButton.js'
import RecordingLength from './RecordingLength.js'
import SubmitButton from './SubmitButton.js'

interface RecordingScreenProps extends AudioSourceSelectProps {
  stream: MediaStream | null | undefined
  recordedAudio: string | null | undefined
  recording: boolean
  supportsRecording: boolean
  showAudioSourceDropdown: boolean | undefined
  onSubmit: () => void
  i18n: I18n
  onStartRecording: () => void
  onStopRecording: () => void
  onStop: () => void
  onDiscardRecordedAudio: () => void
  recordingLengthSeconds: number
}

export default function RecordingScreen(props: RecordingScreenProps) {
  const {
    stream,
    recordedAudio,
    onStop,
    recording,
    supportsRecording,
    audioSources,
    showAudioSourceDropdown,
    onSubmit,
    i18n,
    onStartRecording,
    onStopRecording,
    onDiscardRecordedAudio,
    recordingLengthSeconds,
  } = props

  const canvasEl = useRef<HTMLCanvasElement>(null)
  const oscilloscope = useRef<AudioOscilloscope | null>()

  // componentDidMount / componentDidUnmount
  useEffect(() => {
    return () => {
      oscilloscope.current = null
      onStop()
    }
  }, [onStop])

  // componentDidUpdate
  useEffect(() => {
    if (!recordedAudio) {
      oscilloscope.current = new AudioOscilloscope(canvasEl.current!, {
        canvas: {
          width: 600,
          height: 600,
        },
        canvasContext: {
          lineWidth: 2,
          fillStyle: 'rgb(0,0,0)',
          strokeStyle: 'green',
        },
      })
      oscilloscope.current.draw()

      if (stream) {
        const audioContext = new AudioContext()
        const source = audioContext.createMediaStreamSource(stream)
        oscilloscope.current.addSource(source)
      }
    }
  }, [recordedAudio, stream])

  const hasRecordedAudio = recordedAudio != null
  const shouldShowRecordButton = !hasRecordedAudio && supportsRecording
  const shouldShowAudioSourceDropdown =
    showAudioSourceDropdown &&
    !hasRecordedAudio &&
    audioSources &&
    audioSources.length > 1

  return (
    <div className="uppy-Audio-container">
      <div className="uppy-Audio-audioContainer">
        {hasRecordedAudio ? (
          // biome-ignore lint/a11y/useMediaCaption: ...
          <audio className="uppy-Audio-player" controls src={recordedAudio} />
        ) : (
          <canvas ref={canvasEl} className="uppy-Audio-canvas" />
        )}
      </div>
      <div className="uppy-Audio-footer">
        <div className="uppy-Audio-audioSourceContainer">
          {shouldShowAudioSourceDropdown ? AudioSourceSelect(props) : null}
        </div>
        <div className="uppy-Audio-buttonContainer">
          {shouldShowRecordButton && (
            <RecordButton
              recording={recording}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              i18n={i18n}
            />
          )}

          {hasRecordedAudio && <SubmitButton onSubmit={onSubmit} i18n={i18n} />}

          {hasRecordedAudio && (
            <DiscardButton onDiscard={onDiscardRecordedAudio} i18n={i18n} />
          )}
        </div>

        <div className="uppy-Audio-recordingLength">
          {!hasRecordedAudio && (
            <RecordingLength recordingLengthSeconds={recordingLengthSeconds} />
          )}
        </div>
      </div>
    </div>
  )
}
