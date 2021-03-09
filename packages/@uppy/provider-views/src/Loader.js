const { h } = require('preact')

module.exports = (props) => (
    <div class="uppy-Provider-loading">
      <span>{props.i18n('loading')}</span>
    </div>
)
