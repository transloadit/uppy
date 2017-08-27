// const html = require('yo-yo')

const { h } = require('picodom')
const hyperx = require('hyperx')
const html = hyperx(h, {attrToProp: false})

const Column = require('./TableColumn')

module.exports = (props) => {
  const classes = props.active ? 'BrowserTable-row is-active' : 'BrowserTable-row'
  return html`
    <tr onclick=${props.handleClick} class=${classes}>
      ${Column({
        getItemIcon: props.getItemIcon,
        value: props.title
      })}
    </tr>
  `
}
