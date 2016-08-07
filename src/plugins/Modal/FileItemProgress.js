import html from '../../core/html'

// http://codepen.io/Harkko/pen/rVxvNM
// https://gist.github.com/eswak/ad4ea57bcd5ff7aa5d42

export default function (props, bus) {
  const progress = props.progress

  return html`
      <svg class="UppyIcon UppyIcon-progressCircle" width="25" height="25" viewBox="0 0 44 44">
        <g class="progress-group">
          <circle class="bg" r="15" cx="22" cy="22" stroke-width="4" fill="none" />
          <circle class="progress" r="15" cx="22" cy="22" transform="rotate(-90, 22, 22)" stroke-width="4" fill="none" stroke-dasharray="100" stroke-dashoffset="${100 - progress}" />
        </g>
        <polygon class="play" transform="translate(6, 5.5)" points="13 21.6666667 13 11 21 16.3333333" />
        <g transform="translate(18, 17)" class="pause">
          <rect x="0" y="0" width="2" height="10" rx="0" />
          <rect x="6" y="0" width="2" height="10" rx="0" />
        </g>
        <polygon class="check" transform="translate(6, 7)" points="14 22.5 7 15.2457065 8.99985857 13.1732815 14 18.3547104 22.9729883 9 25 11.1005634" />
    </svg>`
}
