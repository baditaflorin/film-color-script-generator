.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview docker-build docker-push release compose-up compose-down clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "%-20s %s\n", $$1, $$2}'

install-hooks: ## Wire local git hooks
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev: ## Run the frontend dev server
	npm run dev

build: ## Build the GitHub Pages site into docs/
	npm run build

data: ## No-op for Mode A
	@echo "Mode A has no static data pipeline."

test: ## Run unit tests
	npm run test

test-integration: ## No-op for Mode A
	@echo "Mode A has no integration test suite yet."

smoke: ## Build, serve docs/, and run Playwright smoke tests
	npm run smoke

lint: ## Run linters and format checks
	npm run lint

fmt: ## Autoformat files
	npm run fmt

pages-preview: ## Serve docs/ exactly like GitHub Pages
	npm run pages-preview

docker-build: ## No-op for Mode A
	@echo "Mode A has no Docker image."

docker-push: ## No-op for Mode A
	@echo "Mode A has no Docker image."

release: build smoke ## Tag a semver release, for example: make release VERSION=v0.1.0
	@test -n "$(VERSION)" || (echo "VERSION is required, e.g. make release VERSION=v0.1.0" && exit 1)
	git tag "$(VERSION)"
	git push origin "$(VERSION)"

compose-up: ## No-op for Mode A
	@echo "Mode A has no Compose stack."

compose-down: ## No-op for Mode A
	@echo "Mode A has no Compose stack."

clean: ## Remove generated local outputs
	rm -rf coverage playwright-report test-results .vite tmp

hooks-pre-commit:
	.githooks/pre-commit

hooks-commit-msg:
	@test -n "$(MSG)" || (echo "MSG is required, e.g. make hooks-commit-msg MSG=.git/COMMIT_EDITMSG" && exit 1)
	.githooks/commit-msg "$(MSG)"

hooks-pre-push:
	.githooks/pre-push
