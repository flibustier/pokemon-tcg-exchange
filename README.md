# Pokémon TCG Exchange

**Pokémon TCG Exchange** is a community-driven platform designed to help players of Pokémon TCG Pocket efficiently **trade digital cards** and complete their collections. The site provides a seamless, user-friendly interface for requesting missing cards, offering duplicates, and matching with other trainers for fair and secure trades.

---

## What is Pokémon TCG Exchange?

Pokémon TCG Exchange is built for fans of the Pokémon Trading Card Game Pocket app who want to:

- **Request cards** they are missing from their collection.
- **Offer duplicate cards** to trade with others.
- **Automatically match** with other users seeking the same exchange.
- **Coordinate and finalize trades** through an integrated chat system.

### Key Features

- **Automated Matching:** Enter the card you want and the card you offer; the system finds a matching trade partner for you.
- **Secure Communication:** Once matched, a private chat opens to coordinate the trade details.
- **Time-Limited Trades:** You have 48 hours to agree and complete the trade before the match expires.
- **Fair Trading:** The platform supports the Pokémon TCG Pocket's rules—trades must be between cards of the same rarity, and certain rarities or promo cards may not be eligible for trade[4][5].

> _"Request your missing cards, offer a duplicate, wait for a match, and swap seamlessly on Pokémon TCG Pocket!"_[2]

---

## How It Works

1. **List Your Wants and Offers:** Select the card you need and the duplicate you can trade.
2. **Get Matched:** The system searches for another user with a complementary offer.
3. **Connect:** When a match is found, both users receive each other's Pokémon TCG Pocket user ID and friend code.
4. **Chat & Confirm:** Use the built-in chat to arrange the details and confirm the trade.
5. **Trade In-Game:** Complete the actual card swap within Pokémon TCG Pocket.

**Note:** All trades must follow the in-game restrictions—only cards of matching rarity can be exchanged, and certain cards require Trade Tokens or other in-game resources[4][5].

---

## Project Setup

This project is built with **Vue 3** and **Vite**. The cards database is provided by [pokemon-tcg-pocket-database](https://github.com/flibustier/pokemon-tcg-pocket-database).

### Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (disable Vetur).

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, use [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

### Customize Configuration

See [Vite Configuration Reference](https://vite.dev/config/).

---

## Getting Started

### Install Dependencies

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
pnpm build

# Runs the end-to-end tests
pnpm test:e2e
# Runs the tests only on Chromium
pnpm test:e2e --project=chromium
# Runs the tests of a specific file
pnpm test:e2e tests/example.spec.ts
# Runs the tests in debug mode
pnpm test:e2e --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

This project is licensed under the [AGPL-3.0 License](LICENSE).
