const { h } = require('preact')

module.exports = (props) => {
  return ([
    <span class="uppy-ProviderBrowser-user" key="username">{props.username}</span>,
    <button type="button" onclick={props.logout} class="uppy-u-reset uppy-ProviderBrowser-userLogout" key="logout">
      {props.i18n('logOut')}
    </button>
  ])
}
