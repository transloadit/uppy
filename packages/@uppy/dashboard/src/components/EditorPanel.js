const { h } = require('preact')
const classNames = require('classnames')

function EditorPanel (props) {
  const file = this.props.files[this.props.fileCardFor]

  return (
    <div
      class={classNames('uppy-DashboardContent-panel', props.className)}
      role="tabpanel"
      data-uppy-panelType="FileEditor"
      id="uppy-DashboardContent-panel--editor"
    >
      <div class="uppy-DashboardContent-bar">
        <div class="uppy-DashboardContent-title" role="heading" aria-level="1">
          {props.i18nArray('editing', {
            file: <span class="uppy-DashboardContent-titleFile">{file.meta ? file.meta.name : file.name}</span>
          })}
        </div>
        <button
          class="uppy-DashboardContent-back"
          type="button"
          onclick={props.hideAllPanels}
        >
          {props.i18n('done')}
        </button>
      </div>
      <div class="uppy-DashboardContent-panelBody">
        {props.editors.map((target) => {
          return props.getPlugin(target.id).render(props.state)
        })}
      </div>
    </div>
  )
}

module.exports = EditorPanel
