SHELL          := /usr/bin/env bash
ghpages_repo   := "transloadit/uppy"
ghpages_branch := "gh-pages"
ghpages_url    := "git@github.com:$(ghpages_repo).git"

.PHONY: web-install
web-install:
	npm run website:install

.PHONY: web-build
web-build:
	npm run website:build

.PHONY: web-preview
web-preview:
	npm run website:preview

.PHONY: web-deploy
web-deploy:
	npm run website:deploy

.PHONY: watch
watch:
	npm run watch:examples
