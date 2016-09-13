import html from '../../core/html'

export default (props) => {
  // if (uploadStartedFilesCount > 0) {
    // if (inProgressFilesCount > 0) {
    //   return html`<button class="UppyDashboard-pauseResume
    //                              UppyButton--circular
    //                              UppyButton--yellow
    //                              UppyButton--sizeS"
    //                       onclick=${() => props.pauseAll()}>${iconPause()}</button>`
    // }
    //
    // if (uploadStartedFilesCount !== completeFilesCount) {
    //   return html`<button class="UppyDashboard-pauseResume
    //                              UppyButton--circular
    //                              UppyButton--green
    //                              UppyButton--sizeS"
    //                       onclick=${() => props.resumeAll()}>${iconResume()}</button>`
    // }

  const togglePauseResume = (isAllPaused) => {
    if (isAllPaused) {
      return props.resumeAll()
    }
    return props.pauseAll()
  }

  return html`
    <div class="UppyDashboard-actionsItem">
      <button class="UppyTotalProgress
                    ${props.isAllPaused ? 'UppyTotalProgress--is-paused' : ''}
                    ${props.isAllComplete ? 'UppyTotalProgress--is-complete' : ''}"
              onclick=${(ev) => {
                if (props.isAllComplete) return
                togglePauseResume(props.isAllPaused)
              }}>
          <svg width="25" height="25" viewBox="0 0 44 44" class="UppyIcon">
            <g class="progress-group">
              <circle r="15" cx="22" cy="22" stroke-width="3" fill="none" class="bg"/>
              <circle r="15" cx="22" cy="22" transform="rotate(-90, 22, 22)" stroke-width="3" fill="none" stroke-dasharray="100" stroke-dashoffset="${100 - props.totalProgress || 100}" class="progress"/>
            </g>
            <polygon transform="translate(6, 5.5)" points="13 21.6666667 13 11 21 16.3333333" class="play"/>
            <g transform="translate(18, 17)" class="pause">
              <rect x="0" y="0" width="2" height="10" rx="0"/>
              <rect x="6" y="0" width="2" height="10" rx="0"/>
            </g>
            <polygon transform="translate(6, 7)" points="14 22.5 7 15.2457065 8.99985857 13.1732815 14 18.3547104 22.9729883 9 25 11.1005634" class="check"/>
        </svg>
      </button>
      <span class="UppyTotalProgress-info">${props.totalProgress || 0}%</span>
    </div>`
}
