export enum RoomStatus {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
}

// Word Mode
export type WordMode = 'HOST_INPUT' | 'RANDOM' | 'PLAYER_INPUT';

// Socket Constants
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  ROOM_STATE_UPDATED: 'room_state_updated',
  START_GAME: 'start_game',
  GAME_ACTION: 'game_action',
  TIMER_UPDATE: 'timer_update',
  RESET_GAME: 'reset_game',
  UPDATE_CONFIG: 'update_config',
  SUBMIT_WORDS: 'submit_words',
  SUBMIT_PLAYER_WORD: 'submit_player_word',
  GET_CATEGORIES: 'get_categories',
  CATEGORIES_LIST: 'categories_list',
  ERROR: 'error',
} as const;

// Game Action Types
export type GameActionType = 'SUBMIT_GUESS' | 'VOTE_GUESS' | 'END_TURN' | 'GUESS_WORD' | 'NEXT_TURN';

export interface UserState {
  id: string;
  name: string;
  socketId: string;
  score: number;
  roomId: string;
  hasBeenHost?: boolean;
  data?: any; // generic game-specific user data
}

export interface RoomConfig {
  hostSelection: 'ROUND_ROBIN' | 'RANDOM' | 'FIXED';
  timerMin: number;
  maxRounds: number;
  wordMode: WordMode;
  wordCategory?: string; // category name for RANDOM / PLAYER_INPUT modes
}

export type VoteResult = 'YES' | 'NO' | 'MAYBE';

export interface WordCategory {
  name: string;
  count: number;
}

export interface WhoAmIGameState {
  currentTurn: string; // socketId of the active player
  playerWords: Record<string, string>; // socketId -> assigned word
  currentGuess: string | null; // The question/guess the active player is asking
  votes: Record<string, VoteResult>; // socketId -> vote
  turnStatus: 'THINKING' | 'VOTING' | 'RESULT';
  guessResult?: boolean; // True if the turn was a GUESS_WORD turn
  guessedWord?: string; // The word the active player guessed
  winner: string | null; // socketId of the winner if game ends, or DRAW/null
  currentRound: number; // Current round number (1-indexed)
  maxRounds: number; // Total rounds configured
  eliminatedPlayers: string[]; // socketIds of players who guessed wrong and are out
  phase: 'COLLECTING_WORDS' | 'ASKING' | 'FINAL_GUESS';
  finalGuessUsed: string[]; // socketIds who already used their final guess
  // PLAYER_INPUT collection phase
  wordSubmissions?: Record<string, string>; // socketId -> submitted word (during COLLECTING_WORDS)
  wordSubmissionCategory?: string; // category label for PLAYER_INPUT
}

export interface RoomState {
  id: string;
  code: string;
  status: RoomStatus;
  roomHostId: string;
  players: UserState[];
  createdAt: Date;
  endTime?: number;
  config: RoomConfig;
  gameState?: WhoAmIGameState;
}
