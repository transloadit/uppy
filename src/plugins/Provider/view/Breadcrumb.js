const { h } = require('preact')

module.exports = (props) => {
  return <li><button type="button" onclick={props.getFolder}>{props.title}</button></li>
}
