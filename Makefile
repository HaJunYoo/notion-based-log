.PHONY: setup dev run local revalidate-all revalidate-post check-env static

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
ifndef NEXT_JS_SITE_URL
	$(error NEXT_JS_SITE_URL is not set. Please set it in .env.local or provide it as an argument)
endif
ifndef TOKEN_FOR_REVALIDATE
	$(error TOKEN_FOR_REVALIDATE is not set. Please set it in .env.local or provide it as an argument)
endif

setup: check-env
	docker build . -t notion-based-log ; \
	docker run -it --rm -v $(PWD):/app notion-based-log /bin/bash -c "yarn install" ; \
	echo NOTION_PAGE_ID=$(NOTION_PAGE_ID) > .env.local

dev:
	docker run -it --rm -v $(PWD):/app -p 8001:3000 notion-based-log /bin/bash -c "yarn run dev"

run:
	docker run -it --rm -v $(PWD):/app notion-based-log /bin/bash

local:
	yarn dev

static:
	npx serve out

# Manual revalidation commands
revalidate-all: check-env
	@echo "🔄 Revalidating all pages..."
	@echo "Using NEXT_JS_SITE_URL: $(NEXT_JS_SITE_URL)"
	@curl -s "$(NEXT_JS_SITE_URL)/api/revalidate?secret=$(TOKEN_FOR_REVALIDATE)"

revalidate-post: check-env
ifndef SLUG
	$(error SLUG is not set. Please provide it using: make revalidate-post SLUG=your-post-slug)
endif
	@echo "📝 Revalidating post: $(SLUG)..."
	@echo "Using NEXT_JS_SITE_URL: $(NEXT_JS_SITE_URL)"
	@curl -s "$(NEXT_JS_SITE_URL)/api/revalidate?secret=$(TOKEN_FOR_REVALIDATE)&path=/$(SLUG)"
