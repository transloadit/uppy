const { h } = require('preact')
const hyperx = require('hyperx')
const html = hyperx(h)

// http://codepen.io/Harkko/pen/rVxvNM
// https://css-tricks.com/svg-line-animation-works/
// https://gist.github.com/eswak/ad4ea57bcd5ff7aa5d42

// circle length equals 2 * PI * R
const circleLength = 2 * Math.PI * 15

// stroke-dashoffset is a percentage of the progress from circleLength,
// substracted from circleLength, because its an offset
module.exports = (props) => {
  return html`
    <svg width="70" height="70" viewBox="0 0 36 36" class="UppyIcon UppyIcon-progressCircle">
      <g class="progress-group">
        <circle r="15" cx="18" cy="18" stroke-width="2" fill="none" class="bg"/>
        <circle r="15" cx="18" cy="18" transform="rotate(-90, 18, 18)" stroke-width="2" fill="none" class="progress"
                stroke-dasharray=${circleLength}
                stroke-dashoffset=${circleLength - (circleLength / 100 * props.progress)}
        />
      </g>
      <polygon transform="translate(3, 3)" points="12 20 12 10 20 15" class="play"/>
      <g transform="translate(14.5, 13)" class="pause">
        <rect x="0" y="0" width="2" height="10" rx="0" />
        <rect x="5" y="0" width="2" height="10" rx="0" />
      </g>
      <polygon transform="translate(2, 3)" points="14 22.5 7 15.2457065 8.99985857 13.1732815 14 18.3547104 22.9729883 9 25 11.1005634" class="check"/>
      <polygon class="cancel" transform="translate(2, 2)" points="19.8856516 11.0625 16 14.9481516 12.1019737 11.0625 11.0625 12.1143484 14.9481516 16 11.0625 19.8980263 12.1019737 20.9375 16 17.0518484 19.8856516 20.9375 20.9375 19.8980263 17.0518484 16 20.9375 12"></polygon>
  </svg>`
}
