SHELL := /usr/bin/env bash

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
