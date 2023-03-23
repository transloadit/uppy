import { h } from 'preact'

export default ({ i18n, logout, username }) => {
  return ([
    <span className="uppy-ProviderBrowser-user" key="username">{username}</span>,
    <button type="button" onClick={logout} className="uppy-u-reset uppy-c-btn uppy-ProviderBrowser-userLogout" key="logout">
      {i18n('logOut')}
    </button>,
  ])
}
