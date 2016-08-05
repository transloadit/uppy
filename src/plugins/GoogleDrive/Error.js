import yo from 'yo-yo'

export default (props) => {
  return yo`
    <div>
      <span>
        Something went wrong.  Probably our fault. ${props.err}
      </span>
    </div>
  `
}
