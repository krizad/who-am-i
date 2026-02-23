# Online Game Boilerplate

A modern, real-time multiplayer game boilerplate built with a Turborepo monorepo architecture. This boilerplate provides a robust foundation for building any session-based online game.

## 🚀 Features

- **Generic Session Management:** Built-in lobby, connection handling, and room state syncing.
- **Real-time Engine:** Powered by Socket.io for immediate state propagation across clients.
- **Generic Game State:** Easily extend `gameState` to implement your custom game logic via `sendAction` events.
- **Working Example:** Comes pre-configured with a fully playable **Tic-Tac-Toe (OX)** game to demonstrate state handling and socket events.
- **Mobile-First UX/UI:** Fluid, responsive Tailwind layouts ensuring the game looks great on phones, tablets, and desktop.
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

3. Initialize Prisma and push schema:

   ```bash
   pnpm db:push
   ```

4. Start everything:

   ```bash
   pnpm dev
   ```

For full documentation on the architecture, how to implement a custom game, and deployment instructions, see [Document.md](./Document.md).
