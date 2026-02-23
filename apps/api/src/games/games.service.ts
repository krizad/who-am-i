import { Injectable } from '@nestjs/common';
import { RoomState, RoomStatus, UserState, WhoAmIGameState, VoteResult, WordCategory } from '@repo/types';
import { prisma } from '@repo/database';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GamesService {
  private rooms: Map<string, RoomState> = new Map();

  createRoom(hostId: string): RoomState {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: RoomState = {
      id: uuidv4(),
      code,
      status: RoomStatus.LOBBY,
      roomHostId: hostId,
      players: [],
      createdAt: new Date(),
      config: {
        hostSelection: 'ROUND_ROBIN',
        timerMin: 3,
        maxRounds: 3,
        wordMode: 'PLAYER_INPUT',
      }
    };
    this.rooms.set(code, room);
    return room;
  }

  joinRoom(code: string, user: Omit<UserState, 'score' | 'roomId'>): RoomState | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    const existingPlayer = room.players.find(p => p.socketId === user.socketId);
    if (!existingPlayer) {
      room.players.push({
        ...user,
        score: 0,
        roomId: room.id,
      });
    }

    this.rooms.set(code, room);
    return room;
  }

  leaveRoom(clientId: string): RoomState | null {
    for (const [code, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.socketId === clientId);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          this.rooms.delete(code);
          return null;
        }

        if (room.roomHostId === clientId) {
          room.roomHostId = room.players[0].socketId;
        }

        this.rooms.set(code, room);
        return room;
      }
    }
    return null;
  }

  getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code);
  }

  // ─── Categories from DB ────────────────────────────────────────────
  async getCategories(): Promise<WordCategory[]> {
    const results = await prisma.word.groupBy({
      by: ['category'],
      _count: { id: true },
    });
    return results.map(r => ({ name: r.category, count: r._count.id }));
  }

  // ─── Start Game (HOST_INPUT mode) ─────────────────────────────────
  startGameHostInput(code: string, requesterId: string, playerWords: Record<string, string>): RoomState | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    if (room.roomHostId !== requesterId) return null;
    if (room.config.wordMode !== 'HOST_INPUT') return null;

    // Host does NOT play in HOST_INPUT mode
    const gamePlayers = room.players.filter(p => p.socketId !== requesterId);
    if (gamePlayers.length < 2) return null;

    // Verify words provided for all non-host players
    for (const p of gamePlayers) {
      if (!playerWords[p.socketId]?.trim()) return null;
    }

    room.status = RoomStatus.PLAYING;

    const shuffled = [...gamePlayers].sort(() => Math.random() - 0.5);

    const gameState: WhoAmIGameState = {
      currentTurn: shuffled[0].socketId,
      playerWords,
      currentGuess: null,
      votes: {},
      turnStatus: 'VOTING',
      winner: null,
      currentRound: 1,
      maxRounds: room.config.maxRounds,
      eliminatedPlayers: [],
      phase: 'ASKING',
      finalGuessUsed: [],
    };

    room.gameState = gameState;
    this.rooms.set(code, room);
    return room;
  }

  // ─── Start Game (RANDOM mode) ─────────────────────────────────────
  async startGameRandom(code: string, requesterId: string): Promise<RoomState | null> {
    const room = this.rooms.get(code);
    if (!room) return null;
    if (room.roomHostId !== requesterId) return null;
    if (room.config.wordMode !== 'RANDOM') return null;
    if (room.players.length < 2) return null;

    const category = room.config.wordCategory;
    if (!category) return null;

    // Get random words from DB
    const words = await prisma.$queryRawUnsafe<{ word: string; emoji: string | null }[]>(
      `SELECT word, emoji FROM "Word" WHERE category = $1 ORDER BY RANDOM() LIMIT $2`,
      category,
      room.players.length,
    );

    if (words.length < room.players.length) return null; // not enough words in DB

    room.status = RoomStatus.PLAYING;

    const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
    const playerWords: Record<string, string> = {};
    shuffledPlayers.forEach((p, idx) => {
      const w = words[idx];
      playerWords[p.socketId] = w.emoji ? `${w.emoji} ${w.word}` : w.word;
    });

    const gameState: WhoAmIGameState = {
      currentTurn: shuffledPlayers[0].socketId,
      playerWords,
      currentGuess: null,
      votes: {},
      turnStatus: 'VOTING',
      winner: null,
      currentRound: 1,
      maxRounds: room.config.maxRounds,
      eliminatedPlayers: [],
      phase: 'ASKING',
      finalGuessUsed: [],
    };

    room.gameState = gameState;
    this.rooms.set(code, room);
    return room;
  }

  // ─── Start Game (PLAYER_INPUT) — enter COLLECTING_WORDS phase ─────
  startGamePlayerInput(code: string, requesterId: string): RoomState | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    if (room.roomHostId !== requesterId) return null;
    if (room.config.wordMode !== 'PLAYER_INPUT') return null;
    if (room.players.length < 2) return null;

    room.status = RoomStatus.PLAYING;

    const gameState: WhoAmIGameState = {
      currentTurn: '',
      playerWords: {},
      currentGuess: null,
      votes: {},
      turnStatus: 'VOTING',
      winner: null,
      currentRound: 1,
      maxRounds: room.config.maxRounds,
      eliminatedPlayers: [],
      phase: 'COLLECTING_WORDS',
      finalGuessUsed: [],
      wordSubmissions: {},
      wordSubmissionCategory: room.config.wordCategory || '',
    };

    room.gameState = gameState;
    this.rooms.set(code, room);
    return room;
  }

  // ─── Player submits their word (PLAYER_INPUT mode) ────────────────
  submitPlayerWord(code: string, socketId: string, word: string): { room: RoomState; error?: string } | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== RoomStatus.PLAYING) return null;

    const gameState = room.gameState as WhoAmIGameState;
    if (gameState.phase !== 'COLLECTING_WORDS') return null;
    if (!room.players.find(p => p.socketId === socketId)) return null;

    const trimmedWord = word.trim().toLowerCase();
    if (!trimmedWord) return null;

    // Check for duplicates — compare with other players' submissions (not the submitter's own)
    const submissions = gameState.wordSubmissions || {};
    const duplicateEntries = Object.entries(submissions).filter(
      ([sid, w]) => sid !== socketId && w.toLowerCase() === trimmedWord
    );

    if (duplicateEntries.length > 0) {
      // Remove all duplicate submissions (including the existing one)
      for (const [sid] of duplicateEntries) {
        delete submissions[sid];
      }
      // Don't store this one either
      gameState.wordSubmissions = submissions;
      room.gameState = gameState;
      this.rooms.set(code, room);
      return { room, error: `Duplicate word "${word.trim()}"! All matching submissions have been cleared. Please submit a different word.` };
    }

    // Store submission (keep original casing)
    submissions[socketId] = word.trim();
    gameState.wordSubmissions = submissions;

    // Check if all players have submitted
    const allSubmitted = room.players.every(p => submissions[p.socketId]?.trim());

    if (allSubmitted) {
      // Shuffle-assign words so nobody gets their own
      this.assignShuffledWords(room, gameState);
    }

    room.gameState = gameState;
    this.rooms.set(code, room);
    return { room };
  }

  // ─── Shuffle words so no player gets their own ────────────────────
  private assignShuffledWords(room: RoomState, gameState: WhoAmIGameState): void {
    const submissions = gameState.wordSubmissions!;
    const playerIds = room.players.map(p => p.socketId);
    const words = playerIds.map(id => submissions[id]);

    // Derangement: shuffle until nobody has their own word
    let shuffled: string[];
    let attempts = 0;
    do {
      shuffled = [...words].sort(() => Math.random() - 0.5);
      attempts++;
      // Safety: after many attempts, force a derangement via cyclic shift
      if (attempts > 100) {
        shuffled = [...words];
        shuffled.push(shuffled.shift()!); // simple cyclic shift guarantees derangement
        break;
      }
    } while (shuffled.some((w, i) => w === words[i]));

    const playerWords: Record<string, string> = {};
    playerIds.forEach((id, i) => {
      playerWords[id] = shuffled[i];
    });

    gameState.playerWords = playerWords;
    gameState.phase = 'ASKING';
    gameState.wordSubmissions = undefined;

    const shuffledPlayers = [...room.players].sort(() => Math.random() - 0.5);
    gameState.currentTurn = shuffledPlayers[0].socketId;
  }

  // ─── Legacy startGame (called by gateway START_GAME) ──────────────
  startGame(code: string, requesterId: string): RoomState | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    if (room.roomHostId !== requesterId) return null;
    if (room.players.length < 2) return null;

    const mode = room.config.wordMode;

    if (mode === 'PLAYER_INPUT') {
      return this.startGamePlayerInput(code, requesterId);
    }

    // For HOST_INPUT and RANDOM, we return null here because they need extra data
    // HOST_INPUT needs playerWords via SUBMIT_WORDS event
    // RANDOM is async and handled separately
    return null;
  }

  // Helper: find next non-eliminated player who (in FINAL_GUESS phase) hasn't used their guess
  private findNextPlayer(room: RoomState, gameState: WhoAmIGameState, afterSocketId: string): string | null {
    // In HOST_INPUT mode, skip the room host
    const players = room.config.wordMode === 'HOST_INPUT'
      ? room.players.filter(p => p.socketId !== room.roomHostId)
      : room.players;

    const currentIndex = players.findIndex(p => p.socketId === afterSocketId);
    if (currentIndex === -1) {
      // afterSocketId not in players array — find first valid
      for (const p of players) {
        if (gameState.eliminatedPlayers.includes(p.socketId)) continue;
        if (gameState.phase === 'FINAL_GUESS' && gameState.finalGuessUsed.includes(p.socketId)) continue;
        return p.socketId;
      }
      return null;
    }

    for (let i = 1; i <= players.length; i++) {
      const idx = (currentIndex + i) % players.length;
      const p = players[idx];
      if (gameState.eliminatedPlayers.includes(p.socketId)) continue;
      if (gameState.phase === 'FINAL_GUESS' && gameState.finalGuessUsed.includes(p.socketId)) continue;
      return p.socketId;
    }
    return null; // no valid player found
  }

  // Helper: enter FINAL_GUESS phase
  private enterFinalGuessPhase(room: RoomState, gameState: WhoAmIGameState): void {
    const players = room.config.wordMode === 'HOST_INPUT'
      ? room.players.filter(p => p.socketId !== room.roomHostId)
      : room.players;

    gameState.phase = 'FINAL_GUESS';
    const firstPlayer = this.findNextPlayer(room, gameState, players[players.length - 1].socketId);
    if (!firstPlayer) {
      gameState.winner = null;
      room.status = RoomStatus.FINISHED;
    } else {
      gameState.currentTurn = firstPlayer;
      gameState.currentGuess = null;
      gameState.turnStatus = 'VOTING';
      gameState.votes = {};
      gameState.guessResult = undefined;
      gameState.guessedWord = undefined;
    }
  }

  handleGameAction(code: string, requesterId: string, action: any): RoomState | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== RoomStatus.PLAYING) return null;

    const gameState = room.gameState as WhoAmIGameState;

    // Don't allow game actions during word collection
    if (gameState.phase === 'COLLECTING_WORDS') return null;

    if (action.type === 'SUBMIT_GUESS' && typeof action.guess === 'string') {
      if (gameState.currentTurn !== requesterId) return null;
      if (gameState.turnStatus !== 'THINKING') return null;

      gameState.currentGuess = action.guess;
      gameState.turnStatus = 'VOTING';
      gameState.votes = {};

      room.gameState = gameState;
      this.rooms.set(code, room);
      return room;
    }

    if (action.type === 'VOTE_GUESS' && ['YES', 'NO', 'MAYBE'].includes(action.vote)) {
      if (gameState.currentTurn === requesterId) return null;
      if (gameState.turnStatus !== 'VOTING' && gameState.turnStatus !== 'RESULT') return null;
      if (!room.players.find(p => p.socketId === requesterId)) return null;

      gameState.votes[requesterId] = action.vote;

      room.gameState = gameState;
      this.rooms.set(code, room);
      return room;
    }

    if (action.type === 'END_TURN') {
      if (gameState.currentTurn !== requesterId) return null;
      if (gameState.turnStatus !== 'VOTING') return null;
      if (gameState.phase === 'FINAL_GUESS') return null;

      const players = room.config.wordMode === 'HOST_INPUT'
        ? room.players.filter(p => p.socketId !== room.roomHostId)
        : room.players;

      const currentIndex = players.findIndex(p => p.socketId === gameState.currentTurn);
      let nextIndex = (currentIndex + 1) % players.length;
      
      let checked = 0;
      while (gameState.eliminatedPlayers.includes(players[nextIndex].socketId) && checked < players.length) {
        nextIndex = (nextIndex + 1) % players.length;
        checked++;
      }

      if (nextIndex <= currentIndex || checked >= players.length - gameState.eliminatedPlayers.length) {
        gameState.currentRound += 1;
        if (gameState.currentRound > gameState.maxRounds) {
          this.enterFinalGuessPhase(room, gameState);
          room.gameState = gameState;
          this.rooms.set(code, room);
          return room;
        }
      }
      
      gameState.currentTurn = players[nextIndex].socketId;
      gameState.currentGuess = null;
      gameState.turnStatus = 'VOTING';
      gameState.votes = {};
      
      room.gameState = gameState;
      this.rooms.set(code, room);
      return room;
    }

    if (action.type === 'GUESS_WORD') {
      if (gameState.currentTurn !== requesterId) return null;
      if (gameState.turnStatus !== 'VOTING') return null;
      if (typeof action.guess !== 'string' || !action.guess.trim()) return null;
      if (gameState.eliminatedPlayers.includes(requesterId)) return null;

      gameState.turnStatus = 'RESULT';
      gameState.guessResult = true;
      gameState.guessedWord = action.guess.trim();
      gameState.votes = {};
      
      room.gameState = gameState;
      this.rooms.set(code, room);
      return room;
    }

    if (action.type === 'NEXT_TURN') {
      if (gameState.turnStatus !== 'RESULT') return null;

      const votes = Object.values(gameState.votes);
      const yesVotes = votes.filter(v => v === 'YES').length;
      const noVotes = votes.filter(v => v === 'NO').length;
      
      const isCorrectGuess = yesVotes > noVotes;

      const players = room.config.wordMode === 'HOST_INPUT'
        ? room.players.filter(p => p.socketId !== room.roomHostId)
        : room.players;
      
      if (gameState.guessResult && isCorrectGuess) {
        const activePlayer = room.players.find(p => p.socketId === gameState.currentTurn);
        if (activePlayer) activePlayer.score += 1;
        
        gameState.winner = gameState.currentTurn;
        room.status = RoomStatus.FINISHED;
      } else if (gameState.phase === 'FINAL_GUESS') {
        gameState.finalGuessUsed.push(gameState.currentTurn);
        
        const nextPlayer = this.findNextPlayer(room, gameState, gameState.currentTurn);
        
        if (!nextPlayer) {
          gameState.winner = null;
          room.status = RoomStatus.FINISHED;
        } else {
          gameState.currentTurn = nextPlayer;
          gameState.currentGuess = null;
          gameState.turnStatus = 'VOTING';
          gameState.votes = {};
          gameState.guessResult = undefined;
          gameState.guessedWord = undefined;
        }
      } else {
        gameState.eliminatedPlayers.push(gameState.currentTurn);

        const activePlayers = players.filter(p => !gameState.eliminatedPlayers.includes(p.socketId));
        
        if (activePlayers.length === 0) {
          gameState.winner = null;
          room.status = RoomStatus.FINISHED;
          room.gameState = gameState;
          this.rooms.set(code, room);
          return room;
        }

        const nextPlayer = this.findNextPlayer(room, gameState, gameState.currentTurn);
        
        if (!nextPlayer) {
          gameState.winner = null;
          room.status = RoomStatus.FINISHED;
        } else {
          const currentIndex = players.findIndex(p => p.socketId === gameState.currentTurn);
          const nextIndex = players.findIndex(p => p.socketId === nextPlayer);
          
          if (nextIndex <= currentIndex) {
            gameState.currentRound += 1;
            if (gameState.currentRound > gameState.maxRounds) {
              this.enterFinalGuessPhase(room, gameState);
              room.gameState = gameState;
              this.rooms.set(code, room);
              return room;
            }
          }
          
          gameState.currentTurn = nextPlayer;
          gameState.currentGuess = null;
          gameState.turnStatus = 'VOTING';
          gameState.votes = {};
          gameState.guessResult = undefined;
          gameState.guessedWord = undefined;
        }
      }

      room.gameState = gameState;
      this.rooms.set(code, room);
      return room;
    }

    return null;
  }

  endGame(code: string, requesterId: string): RoomState | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== RoomStatus.PLAYING) return null;
    if (room.roomHostId !== requesterId) return null; 

    room.status = RoomStatus.FINISHED;
    this.rooms.set(code, room);
    return room;
  }

  resetGame(code: string, requesterId: string): RoomState | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== RoomStatus.FINISHED) return null;

    if (room.roomHostId !== requesterId) return null;

    room.status = RoomStatus.LOBBY;
    room.endTime = undefined;
    room.gameState = undefined;
    
    room.players.forEach(p => {
      p.data = undefined;
    });

    this.rooms.set(code, room);
    return room;
  }

  updateConfig(code: string, requesterId: string, config: Partial<RoomState['config']>): RoomState | null {
    const room = this.rooms.get(code);
    if (!room || room.status !== RoomStatus.LOBBY) return null;

    if (room.roomHostId !== requesterId) return null;
    
    room.config = { ...room.config, ...config };
    this.rooms.set(code, room);
    return room;
  }
}
