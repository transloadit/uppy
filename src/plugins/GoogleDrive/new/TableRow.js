const html = require('yo-yo')
const Column = require('./TableColumn')

module.exports = (props) => {
  const classes = props.active ? 'BrowserTable-row is-active' : 'BrowserTable-row'
  return html`
    <tr onclick=${props.handleClick} ondblclick=${props.handleDoubleClick} class=${classes}>
      ${Column({
        iconLink: props.iconLink,
        value: props.title || ''
      })}
    </tr>
  `
}
