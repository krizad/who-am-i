# Online Game Boilerplate

A modern, real-time multiplayer game boilerplate built with a Turborepo monorepo architecture. This boilerplate provides a robust foundation for building any session-based online game.

## 🚀 Features

- **Generic Session Management:** Built-in lobby, connection handling, and room state syncing.
- **Real-time Engine:** Powered by Socket.io for immediate state propagation across clients.
- **Generic Game State:** Easily extend `gameState` to implement your custom game logic via `sendAction` events.
- **Working Example:** Includes a complete **Tic-Tac-Toe (OX)** implementation to use as a reference.
- **Mobile-First UX/UI:** Fluid, responsive Tailwind component design focusing on high-quality mobile tap targets and layout behaviors.
- **Modern Tech Stack:** React, Next.js 16 (App Router), NestJS 11, Prisma, and Tailwind CSS v4.

## 📦 Project Structure

```text
online-game-boilerplate/
├── apps/
│   ├── web/       # Next.js frontend (The Players' Screen)
│   └── api/       # NestJS backend/websocket server (The Game Authority)
├── packages/
│   ├── database/  # Prisma schema and generated generic PostgreSQL client
│   ├── config/    # Shared configuration (ESLint, TS, etc.)
│   └── types/     # Shared TypeScript types for typed interactions
└── docker-compose.yml # For setting up local dependencies (like DB)
```

## 🧠 How it Works

The boilerplate is designed to be completely generic.

### 1. Room Model and State

The generic game logic is driven by the `Room` and `User` models defined in `packages/database/schema.prisma` and the `RoomState` and `UserState` types in `packages/types/src/index.ts`.

- **Room Status:** A room can be in `LOBBY`, `PLAYING`, or `FINISHED`.
- **Game State:** The `RoomState.gameState` is a generic `any` (JSON) object that you can define and extend for your specific game rules.

### 2. Actions and Sync (Backend)

In `apps/api/src/games/games.gateway.ts` and `games.service.ts`, there is a single core game action handler:

```typescript
handleGameAction(code: string, requesterId: string, action: any)
```

Whenever a client emits `GAME_ACTION`, this method receives the event. By default, it shallow merges the `action` payload into `room.gameState`. You can override this method to add strict validation, perform private information hiding, and execute your game's state machine.

### 3. Frontend Interactions

Your players interact through `apps/web/src/app/page.tsx`. Use the generic function provided by Zustand:

```typescript
const { sendAction } = useGameStore();

// Example usage:
sendAction({ type: "MOVE", x: 10, y: 15 });
```

## 🛠 Implementing a Custom Game

Currently, the boilerplate implements an active **Tic-Tac-Toe (OX)** example to show how these layers interact. To build your own game, follow this pattern:

1. **Define Types:** Update `packages/types/src/index.ts` to type your specific `gameState` (replacing `OXGameState`). If you need custom user attributes, extend the `data` field in `UserState`.
2. **Handle Actions:** In `apps/api/src/games/games.service.ts`, intercept your specific actions inside `handleGameAction()` (like replacing the `PLACE_MARK` logic) and enforce rules/validation.
3. **Build the UI:** Update `apps/web/src/app/page.tsx`'s `PLAYING` status block to render your dynamic, web-based game UI based on your `room.gameState`. Keep true to the Mobile-First flex/grid foundations!

## 💻 Getting Started Locally

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
   # Make sure your .env has DATABASE_URL pointed to the docker instance
   pnpm db:push
   ```

4. Start everything:

   ```bash
   pnpm dev
   ```

## 🚢 Deployment

1. **Database:** Create a Supabase Session database. Update `DATABASE_URL` in `.env`.
2. **Backend:** Deploy `apps/api` to Render or Railway with WebSocket support. Ensure `CORS_ORIGIN` matches frontend. Let your build command be `pnpm build --filter=api`.
3. **Frontend:** Deploy `apps/web` to Vercel. Set `NEXT_PUBLIC_API_URL` to the backend URL.
