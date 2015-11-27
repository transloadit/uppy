SHELL          := /usr/bin/env bash
ghpages_repo   := "transloadit/uppy"
ghpages_branch := "gh-pages"

.PHONY: pull
pull:
	@echo "--> Running pull.."
	@git pull

.PHONY: website-install
website-install:
	@echo "--> Installing dependencies.."
	@cd website && npm install

.PHONY: website-build
website-build:
	@echo "--> Building site.."
	@cd website && ./node_modules/.bin/hexo generate

.PHONY: website-preview
website-preview: website-install website-build
	@echo "--> Running preview.."
	@cd website && ./node_modules/.bin/hexo server

.PHONY: website-deploy
website-deploy: pull website-build
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
	  && git commit -nm "Update $(ghpages_repo) _site by $${USER}" \
	  && (git remote add origin git@github.com:$(ghpages_repo).git || true)  \
	  && git push origin $(ghpages_branch):refs/heads/$(ghpages_branch) --force

	@rm -rf /tmp/deploy-$(ghpages_repo)
