const User = require('./User')
const Breadcrumbs = require('../Breadcrumbs')

module.exports = (props) => {
  const components = []
  if (props.showBreadcrumbs) {
    components.push(Breadcrumbs({
      getFolder: props.getFolder,
      directories: props.directories,
      breadcrumbsIcon: props.pluginIcon && props.pluginIcon(),
      title: props.title
    }))
  }

  components.push(User({
    logout: props.logout,
    username: props.username,
    i18n: props.i18n
  }))

  return components
}
