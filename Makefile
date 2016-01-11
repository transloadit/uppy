# Licensed under MIT.
# Copyright (2016) by Kevin van Zonneveld https://twitter.com/kvz
#
# This Makefile offers convience shortcuts into any Node.js project that utilizes npm scripts.
# It functions as a wrapper around the actual listed in `package.json`
# So instead of typing:
#
#  $ npm script build:assets
#
# you could also type:
#
#  $ make build-assets
#
# Notice that colons (:) are replaced by dashes for Makefile compatibility.
#
# The benefits of this wrapper are:
#
# - You get to keep the the scripts package.json, which is more portable
#   (Makefiles & Windows are harder to mix)
# - Offer a polite way into the project for developers coming from different
#   languages (npm scripts is obviously very Node centric)
# - Profit from better autocomplete (make <TAB><TAB>) than npm currently offers.
#   OSX users will have to install bash-completion
#   (http://davidalger.com/development/bash-completion-on-os-x-with-brew/)

define npm_script_targets
TARGETS := $(shell node -e 'for (var k in require("./package.json").scripts) {console.log(k.replace(/:/g, "-"));}')
$$(TARGETS):
	npm run $(subst -,:,$(MAKECMDGOALS))

.PHONY: $$(TARGETS)
endef

$(eval $(call npm_script_targets))
