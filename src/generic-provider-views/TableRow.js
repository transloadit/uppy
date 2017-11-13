const html = require('yo-yo')
const Column = require('./TableColumn')

module.exports = (props) => {
  const classes = props.active ? 'BrowserTable-row is-active' : 'BrowserTable-row'
  const handleKeyDown = (event) => {
    if (event.keyCode === 13) props.handleClick()
  }

  return html`
    <tr onclick=${props.handleClick} onkeydown=${handleKeyDown} class=${classes} role="option" tabindex="0">
      ${Column({
        getItemIcon: props.getItemIcon,
        value: props.title
      })}
    </tr>
  `
}
