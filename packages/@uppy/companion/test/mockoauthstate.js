module.exports = () => {
  return {
    generateState: () => 'some-cool-nice-encrytpion',
    addToState: () => 'some-cool-nice-encrytpion',
    getFromState: (state) => {
      if (state === 'state-with-invalid-instance-url') {
        return 'http://localhost:3452'
      }

      return 'http://localhost:3020'
    },
  }
}
