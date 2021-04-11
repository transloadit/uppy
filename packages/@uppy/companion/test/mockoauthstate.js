module.exports = () => {
  return {
    generateState: () => 'some-cool-nice-encrytpion',
    addToState: () => 'some-cool-nice-encrytpion',
    getFromState: (state, key) => {
      if (state === 'state-with-invalid-instance-url') {
        return 'http://localhost:3452'
      }

      if (state === 'state-with-older-version' && key === 'clientVersion') {
        return '@uppy/companion-client=1.0.1'
      }

      if (state === 'state-with-newer-version' && key === 'clientVersion') {
        return '@uppy/companion-client=1.0.3'
      }

      if (state === 'state-with-newer-version-old-style' && key === 'clientVersion') {
        return 'companion-client:1.0.2'
      }

      return 'http://localhost:3020'
    },
  }
}
