.PHONY: setup dev run local build static install generate-rss

# Load environment variables from .env.local if it exists
ifneq (,$(wildcard .env.local))
    include .env.local
    export
endif

# Required environment variables (will use values from .env.local if not set)

# Environment variable validation
check-env:
ifndef NOTION_PAGE_ID
	$(error NOTION_PAGE_ID is not set. Please set it in .env.local or provide it as an argument)
endif

# Development commands
install:
	npm install

build:
	npx next build

local:
	npx serve out

generate-rss:
	npm run postbuild

# Docker commands (legacy)
setup: check-env
	docker build . -t notion-based-log ; \
	docker run -it --rm -v $(PWD):/app notion-based-log /bin/bash -c "npm install" ; \
	echo NOTION_PAGE_ID=$(NOTION_PAGE_ID) > .env.local

docker-dev:
	docker run -it --rm -v $(PWD):/app -p 8001:3000 notion-based-log /bin/bash -c "npx serve out"

docker-run:
	docker run -it --rm -v $(PWD):/app notion-based-log /bin/bash