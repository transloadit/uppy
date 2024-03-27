import PropTypes from 'prop-types'
import { Uppy as UppyCore } from '@uppy/core'

// The `uppy` prop receives the Uppy core instance.
const uppy = PropTypes.instanceOf(UppyCore)

// A list of plugins to mount inside this component.
const plugins = PropTypes.arrayOf(PropTypes.string)

// Language strings for this component.
const locale = PropTypes.shape({
  strings: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  pluralize: PropTypes.func,
})

// List of meta fields for the editor in the Dashboard.
const metaField = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
})
const metaFields = PropTypes.oneOfType([
  PropTypes.arrayOf(metaField),
  PropTypes.func,
])

// A size in pixels (number) or with some other unit (string).
const cssSize = PropTypes.oneOfType([PropTypes.string, PropTypes.number])

export { uppy, locale, plugins, metaFields, cssSize }
