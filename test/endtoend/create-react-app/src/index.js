import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

const errors = []
window.onerror = (err) => {
  errors.push(err)
}
window.errors = errors

const h = React.createElement

ReactDOM.render(<App />, document.getElementById('root'))
