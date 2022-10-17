import { h } from 'preact'

import classNames from 'classnames'
import ItemIcon from './components/ItemIcon.jsx'
import GridListItem from './components/GridLi.jsx'
import ListItem from './components/ListLi.jsx'

export default (props) => {
  const { author, getItemIcon, isChecked, isDisabled, viewType } = props
  const itemIconString = getItemIcon()

  const className = classNames(
    'uppy-ProviderBrowserItem',
    { 'uppy-ProviderBrowserItem--selected': isChecked },
    { 'uppy-ProviderBrowserItem--disabled': isDisabled },
    { 'uppy-ProviderBrowserItem--noPreview': itemIconString === 'video' },
  )

  const itemIconEl = <ItemIcon itemIconString={itemIconString} />

  switch (viewType) {
    case 'grid':
      return (
        <GridListItem
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
          className={className}
          itemIconEl={itemIconEl}
        />
      )
    case 'list':
      return (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <ListItem {...props} className={className} itemIconEl={itemIconEl} />
      )
    case 'unsplash':
      return (
        // eslint-disable-next-line react/jsx-props-no-spreading
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
      throw new Error(`There is no such type ${viewType}`)
  }
}
