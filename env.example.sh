# Rename this file to env.sh, it will be kept out of Git.
# So suitable for adding secret keys and such

export NODE_ENV="${NODE_ENV:-development}"
export UPPYSERVER_DROPBOX_KEY="***"
export UPPYSERVER_DROPBOX_SECRET="***"
export UPPYSERVER_GOOGLE_KEY="***"
export UPPYSERVER_GOOGLE_SECRET="***"
export UPPYSERVER_INSTAGRAM_KEY="***"
export UPPYSERVER_INSTAGRAM_SECRET="***"

# travis encrypt --add GHPAGES_URL=https://secret_access_token@github.com/transloadit/uppy.git
# travis encrypt --add env.global "UPPYSERVER_DROPBOX_KEY=${UPPYSERVER_DROPBOX_KEY}"
# travis encrypt --add env.global "UPPYSERVER_DROPBOX_SECRET=${UPPYSERVER_DROPBOX_SECRET}"
# travis encrypt --add env.global "UPPYSERVER_GOOGLE_KEY=${UPPYSERVER_GOOGLE_KEY}"
# travis encrypt --add env.global "UPPYSERVER_GOOGLE_SECRET=${UPPYSERVER_GOOGLE_SECRET}"
# travis encrypt --add env.global "UPPYSERVER_INSTAGRAM_KEY=${UPPYSERVER_INSTAGRAM_KEY}"
# travis encrypt --add env.global "UPPYSERVER_INSTAGRAM_SECRET=${UPPYSERVER_INSTAGRAM_SECRET}"
