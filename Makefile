SHELL          := /usr/bin/env bash
ghpages_repo   := "transloadit/uppy"
ghpages_branch := "gh-pages"
ghpages_url    := "git@github.com:$(ghpages_repo).git"

.PHONY: website-install
website-install:
	@echo "--> Installing dependencies.."
	@cd website && npm install

.PHONY: website-build
website-build: website-install
	@echo "--> Building site.."
	@npm run build:umd
	@cd website && node update.js
	@cd website && ./node_modules/.bin/hexo generate

.PHONY: website-preview
website-preview: website-build
	@echo "--> Running preview.."
	@cd website && ./node_modules/.bin/hexo server

.PHONY: website-deploy
website-deploy: website-build
	@echo "--> Deploying to GitHub pages.."
	@mkdir -p /tmp/deploy-$(ghpages_repo)

	# Custom steps
	@rsync \
    --archive \
    --delete \
    --exclude=.git* \
    --exclude=node_modules \
    --exclude=lib \
    --itemize-changes \
    --checksum \
    --no-times \
    --no-group \
    --no-motd \
    --no-owner \
	./website/public/ /tmp/deploy-$(ghpages_repo)

	@echo 'This branch is just a deploy target. Do not edit. You changes will be lost.' > /tmp/deploy-$(ghpages_repo)/README.md

	@cd /tmp/deploy-$(ghpages_repo) \
	  && git init && git checkout -B $(ghpages_branch) && git add --all . \
	  && git commit -nm "Update $(ghpages_repo) website by $${USER}" \
	  && (git remote add origin $(ghpages_url)|| true)  \
	  && git push origin $(ghpages_branch):refs/heads/$(ghpages_branch) --force

	@rm -rf /tmp/deploy-$(ghpages_repo)
