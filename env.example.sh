# Rename this file to env.sh, it will be kept out of Git.
# So suitable for adding secret keys and such

export NODE_ENV="${NODE_ENV:-development}"
export UPPYSERVER_DROPBOX_KEY="***"
export UPPYSERVER_DROPBOX_SECRET="***"
export UPPYSERVER_GOOGLE_KEY="***"
export UPPYSERVER_GOOGLE_SECRET="***"
export UPPYSERVER_INSTAGRAM_KEY="***"
export UPPYSERVER_INSTAGRAM_SECRET="***"

# Let's not set this by default, because that will make acceptance tests Always run on Saucelabs
## export SAUCE_ACCESS_KEY="***"
## export SAUCE_USERNAME="***"

# travis encrypt --add GHPAGES_URL=https://secret_access_token@github.com/transloadit/uppy.git
# travis encrypt --add env.global "UPPYSERVER_DROPBOX_KEY=${UPPYSERVER_DROPBOX_KEY}"
# travis encrypt --add env.global "UPPYSERVER_DROPBOX_SECRET=${UPPYSERVER_DROPBOX_SECRET}"
# travis encrypt --add env.global "UPPYSERVER_GOOGLE_KEY=${UPPYSERVER_GOOGLE_KEY}"
# travis encrypt --add env.global "UPPYSERVER_GOOGLE_SECRET=${UPPYSERVER_GOOGLE_SECRET}"
# travis encrypt --add env.global "UPPYSERVER_INSTAGRAM_KEY=${UPPYSERVER_INSTAGRAM_KEY}"
# travis encrypt --add env.global "UPPYSERVER_INSTAGRAM_SECRET=${UPPYSERVER_INSTAGRAM_SECRET}"

# The Travis Sauce Connect addon exports the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables,
# and relays connections to the hub URL back to Sauce Labs.
# See: https://docs.travis-ci.com/user/gui-and-headless-browsers/#Using-Sauce-Labs
# travis encrypt --add addons.sauce_connect.username "${SAUCE_USERNAME}"
# travis encrypt --add addons.sauce_connect.access_key "${SAUCE_ACCESS_KEY}"
