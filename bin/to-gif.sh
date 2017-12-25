#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current file & dir
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__root="$(cd "$(dirname "${__dir}")" && pwd)"

width=600
speed=0.7

ffmpeg \
  -y \
  -i "${__root}/assets/uppy-demo.mp4" \
  -vf fps=10,scale=${width}:-1:flags=lanczos,palettegen "${__root}/assets/palette.png"

ffmpeg \
  -y \
  -i "${__root}/assets/uppy-demo.mp4" \
  -i "${__root}/assets/palette.png" \
  -filter_complex "setpts=${speed}*PTS,fps=10,scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  "${__root}/assets/uppy-demo.gif"

du -hs "${__root}/assets/uppy-demo.gif"
open -a 'Google Chrome' "${__root}/assets/uppy-demo.gif"