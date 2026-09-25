import { Fragment } from 'preact'

type UserProps = {
  i18n: (phrase: string) => string
  logout: () => void
  username: string | null
  disabled?: boolean
}

export default function User({
  i18n,
  logout,
  username,
  disabled = false,
}: UserProps) {
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
        disabled={disabled}
        className="uppy-u-reset uppy-c-btn uppy-ProviderBrowser-userLogout"
        key="logout"
      >
        {i18n('logOut')}
      </button>
    </Fragment>
  )
}
