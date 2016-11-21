import html from '../../core/html'

// http://codepen.io/Harkko/pen/rVxvNM
// https://gist.github.com/eswak/ad4ea57bcd5ff7aa5d42

export default function (props) {
  return html`
    <svg width="70" height="70" viewBox="0 0 36 36" class="UppyIcon UppyIcon-progressCircle">
      <g class="progress-group">
        <circle r="15" cx="18" cy="18" stroke-width="2" fill="none" class="bg"/>
        <circle r="15" cx="18" cy="18" transform="rotate(-90, 18, 18)" stroke-width="2" fill="none" stroke-dasharray="100" stroke-dashoffset="${100 - props.progress}" class="progress"/>
      </g>
      <polygon transform="translate(3, 3)" points="12 20 12 10 20 15" class="play"/>
      <g transform="translate(14.5, 13)" class="pause">
        <rect x="0" y="0" width="2" height="10" rx="0" />
        <rect x="5" y="0" width="2" height="10" rx="0" />
      </g>
      <polygon transform="translate(2, 3)" points="14 22.5 7 15.2457065 8.99985857 13.1732815 14 18.3547104 22.9729883 9 25 11.1005634" class="check"/>
  </svg>`
}
