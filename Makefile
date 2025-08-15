.PHONY: setup dev run local revalidate revalidate-post

NOTION_PAGE_ID= :=
setup:
	docker build . -t notion-based-log ; \
	docker run -it --rm -v $(PWD):/app notion-based-log /bin/bash -c "yarn install" ; \
	echo NOTION_PAGE_ID=$(NOTION_PAGE_ID) > .env.local

dev:
	docker run -it --rm -v $(PWD):/app -p 8001:3000 notion-based-log /bin/bash -c "yarn run dev"

run:
	docker run -it --rm -v $(PWD):/app notion-based-log /bin/bash

local:
	yarn dev

# Revalidation commands
revalidate-all:
	@echo "🔄 Revalidating all pages..."
	@curl -s "http://localhost:3000/api/revalidate?secret=$(TOKEN_FOR_REVALIDATE)"

revalidate-post:
	@echo "📝 Revalidating post: $(SLUG)"
	@curl -s "http://localhost:3000/api/revalidate?secret=$(TOKEN_FOR_REVALIDATE)&path=/$(SLUG)"

revalidate-cron:
	@echo "⏰ Running cron revalidation..."
	@curl -s "http://localhost:3000/api/cron/revalidate-all?secret=$(TOKEN_FOR_REVALIDATE)"

help-revalidate:
	@echo "🔄 Revalidation Commands:"
	@echo "  make revalidate-all TOKEN_FOR_REVALIDATE=your_token"
	@echo "  make revalidate-post SLUG=post-slug TOKEN_FOR_REVALIDATE=your_token"
	@echo "  make revalidate-cron TOKEN_FOR_REVALIDATE=your_token"

# Manual revalidation
revalidate:
@curl -s "http://localhost:3000/api/revalidate?secret=$(TOKEN)"

revalidate-post:
@curl -s "http://localhost:3000/api/revalidate?secret=$(TOKEN)&path=/$(SLUG)"
