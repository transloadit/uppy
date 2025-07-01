import { Fragment, h } from 'preact'

type UserProps = {
  i18n: (phrase: string) => string
  logout: () => void
  username: string | null
}

export default function User({ i18n, logout, username }: UserProps) {
  return (
    <Fragment>
      {username && (
        <span className="uppy-ProviderBrowser-user" key="username">
          {username}
        </span>
      )}
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
