SHELL := /usr/bin/env bash

.PHONY: web-install
web-install:
	npm run web:install

.PHONY: web-build
web-build:
	npm run web:build

.PHONY: web-preview
web-preview:
	npm run web:preview

.PHONY: web-deploy
web-deploy:
	npm run web:deploy

.PHONY: watch
watch:
	npm run watch:examples
