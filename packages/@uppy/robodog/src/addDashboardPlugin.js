const Dashboard = require('@uppy/dashboard')
const has = require('@uppy/utils/lib/hasProperty')

const dashboardOptionNames = [
  'metaFields',
  'width',
  'height',
  'thumbnailWidth',
  'showLinkToFileUploadResult',
  'showErrorIconInFileList',
  'showProgressDetails',
  'hideRetryButton',
  'hidePauseResumeCancelButtons',
  'hideUploadButton',
  'hideProgressAfterFinish',
  'note',
  'disableStatusBar',
  'disableInformer',
  'disableThumbnailGenerator',
  'showSelectedFiles',
  'proudlyDisplayPoweredByUppy',
  'theme'
]

const modalDashboardOptionNames = [
  'trigger',
  'closeModalOnClickOutside',
  'closeAfterFinish',
  'disablePageScrollWhenModalOpen',
  'animateOpenClose',
  'onRequestCloseModal',
  'browserBackButtonClose'
]

function addDashboardPlugin (uppy, opts, overrideOpts) {
  const dashboardOpts = {}
  dashboardOptionNames.forEach((key) => {
    if (has(opts, key)) {
      dashboardOpts[key] = opts[key]
    }
  })

  const inline = overrideOpts.inline == null ? dashboardOpts.inline : overrideOpts.inline
  if (!inline) {
    modalDashboardOptionNames.forEach((key) => {
      if (has(opts, key)) {
        dashboardOpts[key] = opts[key]
      }
    })
  }

  uppy.use(Dashboard, {
    ...dashboardOpts,
    ...overrideOpts
  })
}

module.exports = addDashboardPlugin
