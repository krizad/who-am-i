# 🤖 Agent Context: Who Am I? (Who Know?)

This document provides context and instructions for AI agents working on this repository.

**Mission:** This is a real-time multiplayer "Who Am I?" game. It allows players to join rooms, set word selection modes, and take turns asking questions or guessing their assigned words.

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

## 💾 Core Concept: WhoAmIGameState

The game state is managed centrally in the backend and synced to clients.

1. **Database:** In `schema.prisma`, the `Room` model has a `gameState Json?` field storing the `WhoAmIGameState`.
2. **Types:** Defined in `@repo/types`, `WhoAmIGameState` tracks:
    - `phase`: `COLLECTING_WORDS`, `ASKING`, or `FINAL_GUESS`.
    - `playerWords`: Mapping of socket IDs to words (not shown to the owner).
    - `eliminatedPlayers`: Trace of who guessed wrong and is out.
    - `turnStatus`: `THINKING`, `VOTING`, or `RESULT`.
3. **Communication:** The frontend invokes `sendAction(actionPayload)` in `useGameStore` to emit `GAME_ACTION`.
4. **Backend Handling:** `GamesService.handleGameAction` processes actions like `SUBMIT_GUESS`, `VOTE_GUESS`, `END_TURN`, and `GUESS_WORD`.

> [!IMPORTANT]
> When modifying game rules, update both the `WhoAmIGameState` interface in `@repo/types` and the corresponding logic in `GamesService.handleGameAction`.

## 📌 Development Flow

1. `pnpm install`
2. `docker compose up -d`
3. `pnpm db:push` && `pnpm -F @repo/database db:seed`
4. `pnpm dev`
5. Root `.env` contains all shared environment variables.
