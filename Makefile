.PHONY: setup dev run

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
