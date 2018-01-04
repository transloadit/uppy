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
input="${__root}/assets/uppy-demo2.mov"
base="$(basename "${input}")"
output="${__root}/assets/${base}.gif"

ffmpeg \
  -y \
  -i "${input}" \
  -vf fps=10,scale=${width}:-1:flags=lanczos,palettegen "${__root}/assets/${base}-palette.png"

ffmpeg \
  -y \
  -i "${input}" \
  -i "${__root}/assets/${base}-palette.png" \
  -filter_complex "setpts=${speed}*PTS,fps=10,scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse" \
  "${output}"

du -hs "${output}"
open -a 'Google Chrome' "${output}"