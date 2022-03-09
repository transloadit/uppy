/* eslint-disable jsx-a11y/media-has-caption */
import { h } from 'preact'
import { useEffect, useRef } from 'preact/hooks'
import RecordButton from './RecordButton.jsx'
import RecordingLength from './RecordingLength.jsx'
import AudioSourceSelect from './AudioSourceSelect.jsx'
import AudioOscilloscope from './audio-oscilloscope/index.js'
import SubmitButton from './SubmitButton.jsx'
import DiscardButton from './DiscardButton.jsx'

export default function RecordingScreen (props) {
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

  const canvasEl = useRef(null)
  const oscilloscope = useRef(null)

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
      oscilloscope.current = new AudioOscilloscope(canvasEl.current, {
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
  const shouldShowAudioSourceDropdown = showAudioSourceDropdown
    && !hasRecordedAudio
    && audioSources
    && audioSources.length > 1

  return (
    <div className="uppy-Audio-container">
      <div className="uppy-Audio-audioContainer">
        {hasRecordedAudio
          ? (
            <audio
              className="uppy-Audio-player"
              controls
              src={recordedAudio}
            />
          ) : (
            <canvas
              ref={canvasEl}
              className="uppy-Audio-canvas"
            />
          )}
      </div>
      <div className="uppy-Audio-footer">
        <div className="uppy-Audio-audioSourceContainer">
          {shouldShowAudioSourceDropdown
            ? AudioSourceSelect(props)
            : null}
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

          {hasRecordedAudio && <DiscardButton onDiscard={onDiscardRecordedAudio} i18n={i18n} />}
        </div>

        <div className="uppy-Audio-recordingLength">
          {!hasRecordedAudio && (
            <RecordingLength recordingLengthSeconds={recordingLengthSeconds} i18n={i18n} />
          )}
        </div>
      </div>
    </div>
  )
}
