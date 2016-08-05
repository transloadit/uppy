import yo from 'yo-yo'

export default (props) => {
  return yo`
    <div class="UppyGoogleDrive-authenticate">
      <h1>You need to authenticate with Google before selecting files.</h1>
      <a href=${props.link}>Authenticate</a>
    </div>
  `
}
