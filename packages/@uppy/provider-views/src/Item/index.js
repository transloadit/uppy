const { h } = require('preact')
const classNames = require('classnames')
const ItemIcon = require('./components/ItemIcon')
const GridListItem = require('./components/GridLi')
const ListItem = require('./components/ListLi')

module.exports = (props) => {
  const { author } = props
  const itemIconString = props.getItemIcon()

  const className = classNames(
    'uppy-ProviderBrowserItem',
    { 'uppy-ProviderBrowserItem--selected': props.isChecked },
    { 'uppy-ProviderBrowserItem--disabled': props.isDisabled },
    { 'uppy-ProviderBrowserItem--noPreview': itemIconString === 'video' },
  )

  const itemIconEl = <ItemIcon itemIconString={itemIconString} />

  switch (props.viewType) {
    case 'grid':
      return (
        <GridListItem
          {...props}
          className={className}
          itemIconEl={itemIconEl}
        />
      )
    case 'list':
      return (
        <ListItem {...props} className={className} itemIconEl={itemIconEl} />
      )
    case 'unsplash':
      return (
        <GridListItem {...props} className={className} itemIconEl={itemIconEl}>
          <a
            href={`${author.url}?utm_source=Companion&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="uppy-ProviderBrowserItem-author"
          >
            {author.name}
          </a>
        </GridListItem>
      )
    default:
      throw new Error(`There is no such type ${props.viewType}`)
  }
}
