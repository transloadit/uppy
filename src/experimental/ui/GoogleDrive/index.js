// import Remote from '../../plugins/Remote'
import AuthView from './AuthView'
import Browser from './Browser'
import ErrorView from './ErrorView'

const GoogleDrive = (props) => {
  // Methods
  // const addFile = (file) => {
  //   props.dispatch('add-file', file)
  // }

  // const getFolder = (directory) => {
  //   props.dispatch(Remote.prototype.actions.list(directory))
  // }

  // const filterItems = () => {}

  // Start Component
  const {
    authenticated,
    error,
    link
  } = props

  if (error) {
    return ErrorView({ error: error })
  }

  if (!authenticated) {
    // const authState = btoa(JSON.stringify({
    //   redirect: location.href.split('#')[0]
    // }))

    return AuthView({
      link: link,
      handleDemoAuth: this.handleDemoAuth
    })
  }

  return Browser({})
}

export default GoogleDrive
