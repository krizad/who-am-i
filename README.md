# Who Am I? (Who Know?)

A real-time, modern multiplayer "Who Am I?" (Insider-style) game built with a Turborepo monorepo architecture. 

## 🚀 Features

- **Dynamic Word Selection:** Support for three distinct modes:
    - **HOST_INPUT:** Host assigns words to players (host doesn't participate).
    - **RANDOM:** Words are randomly pulled from a database category.
    - **PLAYER_INPUT:** Each player submits a word; duplicates are rejected, and words are shuffled/assigned blindly.
- **One Guess Rule:** Players have one final guess per game. If they guess incorrectly during the turn phase, they are eliminated for the rest of the round.
- **Real-time Engine:** Powered by Socket.io for immediate state propagation, voting, and turn management.
- **Mobile-First UX/UI:** Fluid, responsive Tailwind v4 layouts optimized for mobile devices.
- **Modern Tech Stack:** React, Next.js 16 (App Router), NestJS 11, Prisma, and Tailwind CSS v4.

## 📌 Getting Started Locally

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start the local database (requires Docker):

   ```bash
   docker compose up -d
   ```

3. Initialize Prisma and Seed Words:

   ```bash
   pnpm db:push
   pnpm -F @repo/database db:seed
   ```

4. Start everything:

   ```bash
   pnpm dev
   ```

For full documentation on the architecture and game states, see [Document.md](./Document.md).

