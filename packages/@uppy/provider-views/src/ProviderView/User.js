const { h } = require('preact')

module.exports = (props) => {
  return ([
    <span className="uppy-ProviderBrowser-user" key="username">{props.username}</span>,
    <button type="button" onClick={props.logout} className="uppy-u-reset uppy-ProviderBrowser-userLogout" key="logout">
      {props.i18n('logOut')}
    </button>,
  ])
}
