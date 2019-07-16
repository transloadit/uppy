const Dashboard = require('@uppy/dashboard')

const dashboardOptionNames = [
  'metaFields',
  'width',
  'height',
  'thumbnailWidth',
  'showLinkToFileUploadResult',
  'showProgressDetails',
  'hideRetryButton',
  'hidePauseResumeCancelButtons',
  'hideProgressAfterFinish',
  'note',
  'disableStatusBar',
  'disableInformer',
  'disableThumbnailGenerator',
  'showSelectedFiles'
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
    if (opts.hasOwnProperty(key)) {
      dashboardOpts[key] = opts[key]
    }
  })

  const inline = overrideOpts.inline == null ? dashboardOpts.inline : overrideOpts.inline
  if (!inline) {
    modalDashboardOptionNames.forEach((key) => {
      if (opts.hasOwnProperty(key)) {
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
