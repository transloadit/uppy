const classNames = require('classnames')
const Breadcrumbs = require('./Breadcrumbs')
const Filter = require('./Filter')
const Table = require('./ItemList')
const FooterActions = require('./FooterActions')
const { h, Component } = require('preact')

module.exports = class Browser extends Component {
  componentWillUnmount () {
    this.props.cancel()
  }

  render (props) {
    let filteredFolders = props.folders
    let filteredFiles = props.files

    if (props.filterInput !== '') {
      filteredFolders = props.filterItems(props.folders)
      filteredFiles = props.filterItems(props.files)
    }

    const selected = props.currentSelection.length

    return (
      <div class={classNames('uppy-ProviderBrowser', `uppy-ProviderBrowser-viewType--${props.viewType}`)}>
        <div class="uppy-ProviderBrowser-header">
          <div class={classNames('uppy-ProviderBrowser-headerBar', !props.showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple')}>
            <div class="uppy-Provider-breadcrumbsIcon">{props.pluginIcon && props.pluginIcon()}</div>
            {props.showBreadcrumbs && <Breadcrumbs
              getFolder={props.getFolder}
              directories={props.directories}
              title={props.title} />
            }
            <button type="button" onclick={props.logout} class="uppy-ProviderBrowser-userLogout">
              {props.i18n('logOut')}
            </button>
          </div>
        </div>
        { props.showFilter && <Filter {...props} /> }
        <Table
          columns={[{
            name: 'Name',
            key: 'title'
          }]}
          folders={filteredFolders}
          files={filteredFiles}
          activeRow={props.isActiveRow}
          sortByTitle={props.sortByTitle}
          sortByDate={props.sortByDate}
          isChecked={props.isChecked}
          handleFolderClick={props.getNextFolder}
          toggleCheckbox={props.toggleCheckbox}
          getItemName={props.getItemName}
          getItemIcon={props.getItemIcon}
          handleScroll={props.handleScroll}
          title={props.title}
          showTitles={props.showTitles}
          getItemId={props.getItemId}
          i18n={props.i18n}
        />
        {selected > 0 && <FooterActions selected={selected} {...props} />}
      </div>
    )
  }
}
