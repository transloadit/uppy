import { h, Fragment } from 'preact'

type UserProps = {
  i18n: (phrase: string) => string
  logout: () => void
  username: string | undefined
}

export default function User({
  i18n,
  logout,
  username,
}: UserProps): JSX.Element {
  return (
    <Fragment>
      <span className="uppy-ProviderBrowser-user" key="username">
        {username}
      </span>
      <button
        type="button"
        onClick={logout}
        className="uppy-u-reset uppy-c-btn uppy-ProviderBrowser-userLogout"
        key="logout"
      >
        {i18n('logOut')}
      </button>
    </Fragment>
  )
}
