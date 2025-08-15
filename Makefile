.PHONY: setup dev run local revalidate-all revalidate-post

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

# Manual revalidation commands
revalidate-all:
@echo "🔄 Revalidating all pages..."
@curl -s "http://localhost:3000/api/revalidate?secret=$(TOKEN)"

revalidate-post:
@echo "📝 Revalidating post: $(SLUG)..."
@curl -s "http://localhost:3000/api/revalidate?secret=$(TOKEN)&path=/$(SLUG)"
