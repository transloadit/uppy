import yo from 'yo-yo'

export default (props, bus) => {
  const state = btoa(JSON.stringify({
    redirect: location.href.split('#')[0]
  }))

  const link = `${props.host}/connect/google?state=${state}`
  return yo`
    <div class="UppyGoogleDrive-authenticate">
      <h1>You need to authenticate with Google before selecting files.</h1>
      <a href=${link}>Authenticate</a>
    </div>
  `
}
