import yo from 'yo-yo'

export default (props) => {
  return yo`
    <li>
      <button onclick=${props.getNextFolder}>${props.title}</button>
    </li>
  `
}
