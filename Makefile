.PHONY: start
start:
	pnpm run dev

.PHONY: deploy
deploy:
    pnpm run upload && pnpm run deploy
