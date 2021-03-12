const { h } = require('preact')
const classNames = require('classnames')
const ItemIcon = require('./components/ItemIcon')
const GridLi = require('./components/GridLi')
const ListLi = require('./components/ListLi')

module.exports = (props) => {
  const itemIconString = props.getItemIcon()

  const className = classNames(
    'uppy-ProviderBrowserItem',
    { 'uppy-ProviderBrowserItem--selected': props.isChecked },
    { 'uppy-ProviderBrowserItem--disabled': props.isDisabled },
    { 'uppy-ProviderBrowserItem--noPreview': itemIconString === 'video' }
  )

  const itemIconEl = <ItemIcon itemIconString={itemIconString} />

  switch (props.viewType) {
    case 'grid':
      return <GridLi {...props} className={className} itemIconEl={itemIconEl} />
    case 'list':
      return <ListLi {...props} className={className} itemIconEl={itemIconEl} />
    default:
      throw new Error(`There is no such type ${props.viewType}`)
  }
}
