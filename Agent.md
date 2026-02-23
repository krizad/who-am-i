# 🤖 Agent Context: Online Game Boilerplate

This document provides context and instructions for AI agents working on this repository.

**Mission:** This is a generic, real-time multiplayer game boilerplate. It is designed to be the foundation for ANY online session-based web game.

## 🛠 Tech Stack

- **Monorepo:** `Turborepo` + `pnpm`
- **Backend:** `NestJS 11` + `Socket.io` (Handles connections, generic game actions, and state broadcasting)
- **Frontend:** `Next.js 16+ (App Router)` + `Zustand` (Handles UI and generic phase rendering)
- **ORM:** `Prisma` + `PostgreSQL` (Stores Rooms and Users, utilizing a generic JSON column for game state)
- **UI:** `Tailwind CSS v4` + basic HTML/React components (Mobile-First, entirely responsive layout)

---

## 🏗 Project Structure

```text
online-game-boilerplate/
├── apps/
│   ├── web/                # Next.js Frontend (The Player's Screen)
│   │   ├── src/app/        # Main pages and UI
│   │   └── src/store/      # Zustand store (`useGameStore.ts`) for real-time state
│   └── api/                # NestJS Backend (The Brain)
│       ├── src/games/      # Game Logic (`games.service.ts`) & Socket Gateway (`games.gateway.ts`)
├── packages/
│   ├── database/           # Shared Prisma Client & Schema (`schema.prisma`)
│   ├── types/              # Shared TS Interfaces (`index.ts`)
│   └── config/             # Shared ESLint, Prettier, TSConfig
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## 💾 Core Concept: Generic Game State

The most important concept in this boilerplate is the `gameState`.

1. **Database:** In `schema.prisma`, the `Room` model has a `gameState Json?` field.
2. **Types:** In `@repo/types`, `RoomState` has an optional `gameState?: any` field.
3. **Communication:** The frontend sends all interactions through a single generic socket event `GAME_ACTION` by calling `sendAction(actionPayload)` in `useGameStore`.
4. **Backend Handling:** The NestJS `GamesGateway` catches `GAME_ACTION` and passes it to `GamesService.handleGameAction`. By default, this simply merges the action data into the `gameState`.

> [!NOTE]
> Currently, the codebase ships with a working **Tic-Tac-Toe (OX)** example. `OXGameState` is defined in `@repo/types`, and `GamesService.handleGameAction` intercepts the `PLACE_MARK` action to enforce turns and calculate wins.

**When building a new game using this boilerplate:**
An agent should modify `handleGameAction` in the backend to validate moves and enforce specific game rules, and update the frontend UI to render according to the custom `gameState` properties, replacing the OX example. The fundamental connection and Lobby mechanics should not be drastically altered unless necessary.

## 📌 Development Flow

1. `pnpm install`
2. `docker compose up -d`
3. `pnpm db:push`
4. `pnpm dev`
