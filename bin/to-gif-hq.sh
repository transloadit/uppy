#!/bin/sh
# Convert a video file to a gif.
# `to-gif /path/to/input.mp4 /path/to/output.gif`
palette="/tmp/to-gif-palette.png"
filters="fps=15"
ffmpeg -v warning -i $1 -vf "$filters,palettegen" -y $palette
ffmpeg -v warning -i $1 -i $palette -lavfi "$filters [x]; [x][1:v] paletteuse" -y $2

# gifsicle --resize-fit-width 1000 -i animation.gif > animation-1000px.gif
