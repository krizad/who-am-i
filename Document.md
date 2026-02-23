# Who Am I? (Who Know?)

A real-time, session-based multiplayer game where players try to guess their assigned words.

## 🚀 Features

- **Word Selection Modes:** 
    - `HOST_INPUT`: Host provides words for everyone (host doesn't play).
    - `RANDOM`: Words selected from a chosen category in the database.
    - `PLAYER_INPUT`: Players submit words for each other.
- **Phase Management:** Clear transitions between `COLLECTING_WORDS`, `ASKING` (turns and questions), and `FINAL_GUESS`.
- **Voting System:** Players vote "YES", "NO", or "MAYBE" on questions and guesses.
- **Elimination:** High-stakes guessing—if your guess is rejected by the group, you're eliminated!

## 📦 Project Structure

```text
who-am-i/
├── apps/
│   ├── web/       # Next.js frontend (Tailwind CSS, Zustand)
│   └── api/       # NestJS backend (Socket.io, Game Logic)
├── packages/
│   ├── database/  # Prisma schema and seed scripts
│   ├── config/    # Shared linting and TS config
│   └── types/     # Shared interfaces (WhoAmIGameState, RoomState, etc.)
└── .env           # Consolidated root environment variables
```

## 🧠 How it Works

### 1. Game State (`WhoAmIGameState`)

Located in `packages/types/src/index.ts`. It tracks the current turn, assigned words, active guesses, votes, and eliminated players.

### 2. Actions and Sync

Clients interact via the `GAME_ACTION` socket event. Handled by `GamesService.handleGameAction` in `apps/api/src/games/games.service.ts`.

**Action Types:**
- `SUBMIT_GUESS`: Send a question/word guess.
- `VOTE_GUESS`: Vote on the current player's question.
- `END_TURN`: Move to the next player.
- `GUESS_WORD`: Trigger the final word guess check.
- `NEXT_TURN`: Confirm the result of a guess and progress the turn.

### 3. Word Modes

1. **Host Input:** Host enters words in the lobby before starting.
2. **Random:** Backend queries the `Word` table for random entries in a category.
3. **Player Input:** A dedicated `COLLECTING_WORDS` phase where everyone submits a word. The system shuffles and assigns them ensuring no one gets their own.

## 💻 Getting Started Locally

1. **Install:** `pnpm install`
2. **DB:** `docker compose up -d`
3. **Push Schema & Seed:** `pnpm db:push && pnpm -F @repo/database db:seed`
4. **Dev:** `pnpm dev`

## 🚢 Deployment

1. **Database:** Supabase (Session or Transaction mode). Update `DATABASE_URL`.
2. **Backend (API):** Deploy to Railway or Render with WebSocket support. Ensure `CORS_ORIGIN` matches your frontend URL.
3. **Frontend (Web):** Deploy to Vercel. Set `NEXT_PUBLIC_API_URL` to your backend endpoint.

