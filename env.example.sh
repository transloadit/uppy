# Rename this file to env.sh, it will be kept out of Git.
# So suitable for adding secret keys and such

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__file="${__dir}/$(basename "${BASH_SOURCE[0]}")"
__base="$(basename ${__file} .sh)"
__rootdir="${__dir}"

export NODE_ENV="${NODE_ENV:-development}"
export UPPYSERVER_DROPBOX_KEY="***"
export UPPYSERVER_DROPBOX_SECRET="***"
export UPPYSERVER_GOOGLE_KEY="***"
export UPPYSERVER_GOOGLE_SECRET="***"
export UPPYSERVER_INSTAGRAM_KEY="***"
export UPPYSERVER_INSTAGRAM_SECRET="***"

# source env.sh
# travis encrypt --add env.global "UPPYSERVER_DROPBOX_KEY=${UPPYSERVER_DROPBOX_KEY}"
# travis encrypt --add env.global "UPPYSERVER_DROPBOX_SECRET=${UPPYSERVER_DROPBOX_SECRET}"
# travis encrypt --add env.global "UPPYSERVER_GOOGLE_KEY=${UPPYSERVER_GOOGLE_KEY}"
# travis encrypt --add env.global "UPPYSERVER_GOOGLE_SECRET=${UPPYSERVER_GOOGLE_SECRET}"
# travis encrypt --add env.global "UPPYSERVER_INSTAGRAM_KEY=${UPPYSERVER_INSTAGRAM_KEY}"
# travis encrypt --add env.global "UPPYSERVER_INSTAGRAM_SECRET=${UPPYSERVER_INSTAGRAM_SECRET}"
