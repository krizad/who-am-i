"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { RoomStatus, WhoAmIGameState, WordMode } from '@repo/types';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ANIMAL_EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'];

function getAvatarEmoji(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ANIMAL_EMOJIS.length;
  return ANIMAL_EMOJIS[index];
}

function GameLobby() {
  const { connect, connected, room, myName, setName, createRoom, joinRoom, startGame, sendAction, updateConfig, submitWords, submitPlayerWord, getCategories, categories } = useGameStore();
  const searchParams = useSearchParams();
  const roomQuery = searchParams.get('room');
  
  const [joinCode, setJoinCode] = useState(roomQuery || '');
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [showHostWordModal, setShowHostWordModal] = useState(false);
  const [hostWordInputs, setHostWordInputs] = useState<Record<string, string>>({});
  const [playerWordInput, setPlayerWordInput] = useState('');

  useEffect(() => {
    connect();
  }, [connect]);

  if (!connected) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-slate-950">
        <h1 className="text-4xl font-bold animate-pulse text-slate-400">Connecting...</h1>
      </main>
    );
  }

  if (!room) {
    if (roomQuery) {
      return (
        <main className="flex min-h-dvh flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-200 relative">
          <div className="w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 to-purple-500"></div>
            <div className="flex justify-center mb-4 mt-2">
              <div className="w-20 h-20 rounded-2xl shadow-lg shadow-indigo-500/20 border border-slate-700 bg-indigo-600 flex items-center justify-center flex-col">
                <span className="text-3xl">🎮</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-center mb-2 tracking-tighter text-white">
              You've been invited!
            </h1>
            <p className="text-center text-slate-400 mb-8 font-medium">
              Join room <span className="text-indigo-400 font-mono font-bold">{roomQuery.toUpperCase()}</span>
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={myName}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && myName && joinCode.length >= 4) {
                      joinRoom(joinCode);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-center text-lg shadow-inner"
                  placeholder="Enter your name to play"
                  autoFocus
                />
              </div>

              <button 
                onClick={() => joinRoom(joinCode)}
                disabled={!myName || joinCode.length < 4}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                Enter Game
              </button>

              <button 
                onClick={() => {
                  window.history.replaceState({}, document.title, window.location.pathname);
                  setJoinCode('');
                }}
                className="w-full text-slate-500 hover:text-slate-300 font-medium text-sm transition-colors py-2"
              >
                Or create your own room
              </button>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-200 relative">
        <div className="w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-4xl shadow-2xl shadow-indigo-500/20 border border-slate-700 bg-indigo-600 flex items-center justify-center">
              <span className="text-5xl">OX</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-center mb-8 tracking-tighter bg-linear-to-br from-indigo-400 to-purple-500 bg-clip-text text-transparent">
            WHO AM I?
          </h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Display Name</label>
              <input 
                type="text" 
                value={myName}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                placeholder="Enter your name"
              />
            </div>

            <button 
              onClick={createRoom}
              disabled={!myName}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              Create New Room
            </button>

            <div className="relative flex items-center py-2">
              <div className="grow border-t border-slate-800"></div>
              <span className="shrink-0 mx-4 text-slate-500 text-sm font-medium">OR</span>
              <div className="grow border-t border-slate-800"></div>
            </div>

            <div className="flex gap-3">
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && myName && joinCode.length >= 4) {
                    joinRoom(joinCode);
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono uppercase font-bold text-center"
                placeholder="ROOM CODE"
                maxLength={6}
              />
              <button 
                onClick={() => joinRoom(joinCode)}
                disabled={!myName || joinCode.length < 4}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 rounded-xl transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Type inference for the Who Am I game state
  const gameState = room.gameState as WhoAmIGameState | undefined;
  
  // Game Helpers
  const mySocketId = useGameStore.getState().socketId;
  const isSpectator = !room.players.find(p => p.socketId === mySocketId);
  const isMyTurn = !isSpectator && gameState?.currentTurn === mySocketId && room.status === RoomStatus.PLAYING;
  
  // Removed guessInput state from here (moved to top of component)

  return (
    <main className="flex min-h-dvh flex-col items-center p-2 sm:p-4 bg-slate-950 text-slate-200 overflow-x-hidden">
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-2 sm:gap-4 flex-1 relative">
        <header className="flex-none flex items-center justify-between gap-4 p-2 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-10 w-full">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap w-full">
            <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-700 bg-indigo-600 flex items-center justify-center flex-col text-sm">🕵️</div>
            <span className="text-xs font-medium text-slate-500 hidden sm:block">Room</span>
            <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-indigo-400 leading-none">{room.code}</span>
            <button 
              onClick={() => {
                const inviteLink = `${window.location.origin}/?room=${room.code}`;
                navigator.clipboard.writeText(inviteLink);
                toast.success('Invite link copied!');
              }}
              className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 font-bold px-2.5 py-1.5 rounded-lg transition-colors text-xs flex items-center gap-1.5 sm:ml-2"
              title="Copy Invite Link"
            >
              <span className="hidden sm:inline">Copy Link</span>
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 sm:gap-4">
          
          {/* Game Area */}
          <div className="flex-1 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl min-h-[450px] order-1 md:order-2 relative overflow-hidden">
            
            {/* LOBBY */}
            {room.status === RoomStatus.LOBBY && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[150px]">
                <h4 className="text-lg font-black uppercase text-indigo-400 tracking-widest bg-indigo-500/10 px-4 py-2 rounded-lg border border-indigo-500/20">Waiting Room</h4>
                <p className="text-slate-400 text-sm text-center">Waiting for players to join (Need at least 2)</p>

                {/* Room Config (host only) */}
                {mySocketId === room.roomHostId && (
                  <div className="w-full max-w-[340px] flex flex-col gap-4">
                    {/* Rounds */}
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Number of Rounds</label>
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => updateConfig({ maxRounds: Math.max(1, (room.config.maxRounds || 3) - 1) })}
                          className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-90 text-white font-black text-xl transition-all border border-slate-600 flex items-center justify-center"
                        >−</button>
                        <span className="text-3xl font-black text-indigo-400 w-12 text-center tabular-nums">{room.config.maxRounds || 3}</span>
                        <button
                          onClick={() => updateConfig({ maxRounds: Math.min(20, (room.config.maxRounds || 3) + 1) })}
                          className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-90 text-white font-black text-xl transition-all border border-slate-600 flex items-center justify-center"
                        >+</button>
                      </div>
                    </div>

                    {/* Word Mode */}
                    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Word Mode</label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { mode: 'HOST_INPUT' as WordMode, label: '📝 Host', desc: 'Host picks words' },
                          { mode: 'RANDOM' as WordMode, label: '🎲 Random', desc: 'From database' },
                          { mode: 'PLAYER_INPUT' as WordMode, label: '✍️ Players', desc: 'Each player writes' },
                        ]).map(({ mode, label, desc }) => (
                          <button
                            key={mode}
                            onClick={() => {
                              updateConfig({ wordMode: mode });
                              if (mode === 'RANDOM') getCategories();
                            }}
                            className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                              room.config.wordMode === mode
                                ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300 ring-2 ring-indigo-500/30'
                                : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'
                            }`}
                          >
                            <span className="text-sm font-bold">{label}</span>
                            <span className="text-[10px] opacity-70">{desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category picker for RANDOM mode */}
                    {room.config.wordMode === 'RANDOM' && (
                      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                        {categories.length === 0 ? (
                          <p className="text-slate-500 text-sm italic">No categories found in database. Add words first.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                              <button
                                key={cat.name}
                                onClick={() => updateConfig({ wordCategory: cat.name })}
                                className={`px-3 py-2 rounded-lg text-sm font-bold transition-all border ${
                                  room.config.wordCategory === cat.name
                                    ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300'
                                    : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:bg-slate-800/80'
                                }`}
                              >
                                {cat.name} <span className="text-[10px] opacity-60">({cat.count})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Category label for PLAYER_INPUT */}
                    {room.config.wordMode === 'PLAYER_INPUT' && (
                      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category / Theme (optional)</label>
                        <input
                          type="text"
                          value={room.config.wordCategory || ''}
                          onChange={(e) => updateConfig({ wordCategory: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                          placeholder="e.g. Animals, Movies, Famous People..."
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Non-host: show current config */}
                {mySocketId !== room.roomHostId && (
                  <div className="text-sm text-slate-500 flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <span>Rounds:</span>
                      <span className="font-bold text-indigo-400">{room.config.maxRounds || 3}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Mode:</span>
                      <span className="font-bold text-indigo-400">
                        {room.config.wordMode === 'HOST_INPUT' ? '📝 Host Input' : room.config.wordMode === 'RANDOM' ? '🎲 Random' : '✍️ Player Input'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Start Game Button */}
                {mySocketId === room.roomHostId ? (
                  <button 
                    onClick={() => {
                      if (room.config.wordMode === 'HOST_INPUT') {
                        const inputs: Record<string, string> = {};
                        room.players.filter(p => p.socketId !== mySocketId).forEach(p => { inputs[p.socketId] = ''; });
                        setHostWordInputs(inputs);
                        setShowHostWordModal(true);
                      } else if (room.config.wordMode === 'RANDOM') {
                        startGame();
                      } else {
                        startGame();
                      }
                    }}
                    disabled={room.players.length < 2 || (room.config.wordMode === 'RANDOM' && !room.config.wordCategory)}
                    className="w-full max-w-[250px] bg-green-600 hover:bg-green-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg py-4 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-green-900/20"
                  >
                    Start Game
                  </button>
                ) : (
                  <div className="w-full max-w-xs bg-slate-800/50 text-slate-400 border border-slate-800 font-bold text-sm py-4 rounded-xl text-center uppercase tracking-widest">
                    Waiting for Room Host
                  </div>
                )}
              </div>
            )}
            
            {/* PLAYING WHO AM I */}
            {room.status === RoomStatus.PLAYING && gameState && (
              <div className="flex-1 flex flex-col h-full">

                {/* COLLECTING_WORDS PHASE */}
                {gameState.phase === 'COLLECTING_WORDS' && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
                    <h4 className="text-lg font-black uppercase text-purple-400 tracking-widest bg-purple-500/10 px-4 py-2 rounded-lg border border-purple-500/20 animate-pulse">
                      ✍️ Submit Your Word
                    </h4>
                    {gameState.wordSubmissionCategory && (
                      <p className="text-slate-400 text-sm">Category: <span className="font-bold text-indigo-400">{gameState.wordSubmissionCategory}</span></p>
                    )}
                    <p className="text-slate-400 text-sm text-center max-w-md">Each player writes a word. Words are shuffled so you won't get your own! Duplicates will be rejected.</p>

                    {/* Input */}
                    {gameState.wordSubmissions?.[mySocketId] ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                        <span className="text-emerald-400 font-bold">✅ Word submitted!</span>
                        <p className="text-slate-400 text-sm mt-1">Waiting for others...</p>
                      </div>
                    ) : (
                      <div className="w-full max-w-sm flex flex-col gap-3">
                        <input
                          type="text"
                          value={playerWordInput}
                          onChange={(e) => setPlayerWordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && playerWordInput.trim()) {
                              submitPlayerWord(playerWordInput.trim());
                              setPlayerWordInput('');
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-inner"
                          placeholder="Type your word..."
                          autoFocus
                        />
                        <button
                          onClick={() => { submitPlayerWord(playerWordInput.trim()); setPlayerWordInput(''); }}
                          disabled={!playerWordInput.trim()}
                          className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                        >Submit Word</button>
                      </div>
                    )}

                    {/* Submission Status */}
                    <div className="w-full max-w-sm">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Submissions</label>
                      <div className="flex flex-wrap gap-2">
                        {room.players.map(p => {
                          const hasSubmitted = !!gameState.wordSubmissions?.[p.socketId];
                          return (
                            <div key={p.id} className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${hasSubmitted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800/50 text-slate-500 border-slate-700/50'}`}>
                              <span className="text-sm">{hasSubmitted ? '✅' : '⏳'}</span>
                              {p.name}{p.socketId === mySocketId && ' (You)'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Normal game UI (ASKING / FINAL_GUESS phases) */}
                {gameState.phase !== 'COLLECTING_WORDS' && (<>
                
                {/* Status Bar */}
                <div className="flex flex-col items-center justify-center text-center mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    {gameState.phase === 'FINAL_GUESS' ? (
                      <span className="bg-amber-500/20 text-amber-400 text-xs font-black px-3 py-1 rounded-full border border-amber-500/30 animate-pulse uppercase tracking-wider">⚡ Final Guess!</span>
                    ) : (
                      <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">Round {gameState.currentRound} / {gameState.maxRounds}</span>
                    )}
                  </div>
                  {isSpectator ? (
                    <span className="text-slate-400 font-medium bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">You are spectating. Current turn: {room.players.find(p => p.socketId === gameState.currentTurn)?.name}</span>
                  ) : isMyTurn ? (
                    <span className="text-emerald-400 animate-pulse font-black uppercase tracking-wider bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">It's Your Turn!</span>
                  ) : (
                    <span className="text-slate-300 font-medium bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 shadow-sm">Waiting for <span className="text-indigo-400 font-bold">{room.players.find(p => p.socketId === gameState.currentTurn)?.name}</span> to play...</span>
                  )}
                </div>

                {/* Player Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  <AnimatePresence>
                    {room.players.map((player) => {
                      const isActive = player.socketId === gameState.currentTurn;
                      const isMe = player.socketId === mySocketId;
                      const word = gameState.playerWords[player.socketId];
                      const isEliminated = gameState.eliminatedPlayers?.includes(player.socketId);
                      
                      return (
                        <motion.div
                          key={player.id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: isEliminated ? 0.5 : 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 ${isEliminated ? 'bg-rose-900/20 border-rose-500/30 grayscale' : isActive ? 'bg-indigo-900/40 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-slate-800/50 border-slate-700/50'}`}
                        >
                          {isEliminated ? (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">Eliminated</span>
                            </div>
                          ) : isActive && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-indigo-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md">Active</span>
                            </div>
                          )}
                          
                          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-3xl shadow-inner border-2 border-slate-600 mb-3 relative overflow-hidden">
                            {getAvatarEmoji(player.id)}
                            {isMe && <div className="absolute inset-0 bg-blue-500/20 rounded-full"></div>}
                          </div>
                          <span className={`font-bold text-sm truncate w-full text-center ${isMe ? 'text-indigo-300' : 'text-slate-300'} mb-3`}>
                            {player.name} {isMe && '(You)'}
                          </span>

                          {/* 3D Flip Card for Word */}
                          <div className="w-full h-20 perspective-1000">
                            <motion.div
                              className="w-full h-full relative preserve-3d"
                              animate={{ rotateY: isMe ? 0 : 180 }}
                              transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            >
                              {/* Front of card (Hidden from player) */}
                              <div className="absolute inset-0 w-full h-full backface-hidden bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center shadow-lg">
                                <span className="text-3xl animate-pulse opacity-80">❓</span>
                              </div>
                              {/* Back of card (Visible to others) */}
                              <div className="absolute inset-0 w-full h-full backface-hidden bg-linear-to-br from-indigo-600 to-purple-600 rounded-xl border border-indigo-400/50 flex flex-col items-center justify-center shadow-lg transform rotate-y-180 p-2">
                                <span className="text-xs text-indigo-200/80 font-medium mb-1 uppercase tracking-wider">They are</span>
                                <span className="text-white font-black text-center break-words leading-tight">{word}</span>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Interaction Panels */}
                <div className="mt-auto bg-slate-950/50 rounded-2xl p-4 sm:p-6 border border-slate-800/80">
                  
                  {gameState.turnStatus === 'THINKING' && (
                    <div className="text-center py-6 flex flex-col items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin mb-3"></div>
                      <p className="text-slate-400 font-medium text-center">Preparing next turn...</p>
                    </div>
                  )}

                  {gameState.turnStatus === 'VOTING' && (
                    <div className="text-center animate-in zoom-in-95 fade-in duration-300">
                      <div className="mb-6">
                        {gameState.phase === 'FINAL_GUESS' ? (
                          <>
                            <h4 className="text-lg font-black text-amber-400">⚡ Final Guess Round</h4>
                            <p className="text-slate-400 text-sm mt-1">{isMyTurn ? "This is your last chance! Guess your word now!" : "Waiting for the player to guess their word..."}</p>
                          </>
                        ) : (
                          <>
                            <h4 className="text-lg font-black text-indigo-400">Asking Phase</h4>
                            <p className="text-slate-400 text-sm mt-1">{isMyTurn ? "Ask the group a Yes/No question out loud!" : "Vote on the player's verbal question!"}</p>
                          </>
                        )}
                      </div>

                      {isMyTurn ? (
                        <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 fade-in">
                          <p className="text-slate-300 text-center text-sm font-medium mb-2">When you are satisfied with the answers, click below to end your turn.</p>
                          
                          {(() => {
                            const votes = Object.values(gameState.votes);
                            if (votes.length === 0) return <p className="text-slate-500 italic mt-2 mb-4 font-medium">Waiting for votes...</p>;
                            
                            const yesCount = votes.filter(v => v === 'YES').length;
                            const noCount = votes.filter(v => v === 'NO').length;
                            const maybeCount = votes.filter(v => v === 'MAYBE').length;
                            
                            const max = Math.max(yesCount, noCount, maybeCount);
                            let majority = 'Tied / Mixed';
                            let colorClass = 'text-slate-300 border-slate-700 bg-slate-800/50';
                            
                            if (yesCount === max && yesCount > noCount && yesCount > maybeCount) {
                              majority = 'YES';
                              colorClass = 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
                            } else if (noCount === max && noCount > yesCount && noCount > maybeCount) {
                              majority = 'NO';
                              colorClass = 'text-rose-400 border-rose-500/50 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
                            } else if (maybeCount === max && maybeCount > yesCount && maybeCount > noCount) {
                              majority = 'MAYBE';
                              colorClass = 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
                            }

                            return (
                              <div className={`mt-2 mb-4 p-4 border-2 rounded-2xl flex flex-col items-center justify-center min-w-[240px] transition-all duration-300 ${colorClass}`}>
                                <span className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">Majority Answer</span>
                                <span className="text-4xl font-black">{majority}</span>
                                <div className="flex gap-4 mt-3 text-sm font-bold opacity-80 border-t border-current/20 pt-2 w-full justify-center">
                                  <span className={yesCount > 0 ? "text-emerald-400" : ""}>Yes: {yesCount}</span>
                                  <span className={noCount > 0 ? "text-rose-400" : ""}>No: {noCount}</span>
                                  <span className={maybeCount > 0 ? "text-amber-400" : ""}>Maybe: {maybeCount}</span>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full justify-center">
                            {gameState.phase !== 'FINAL_GUESS' && (
                              <button
                                onClick={() => {
                                  sendAction({ type: 'END_TURN' });
                                }}
                                className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold px-6 py-4 rounded-xl transition-all shadow-lg uppercase tracking-widest w-full sm:w-auto border border-slate-600"
                              >
                                End Asking
                              </button>
                            )}
                            {gameState.eliminatedPlayers?.includes(mySocketId) ? (
                              <div className="bg-rose-900/30 text-rose-400 border border-rose-500/30 font-bold px-8 py-4 rounded-xl text-sm text-center w-full sm:w-auto">
                                ❌ You've used your guess
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setGuessInput('');
                                  setShowGuessModal(true);
                                }}
                                className={`${gameState.phase === 'FINAL_GUESS' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'} active:scale-95 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg uppercase tracking-widest w-full sm:w-auto`}
                              >
                                Guess the Word!
                              </button>
                            )}
                          </div>
                          
                          <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {Object.entries(gameState.votes).map(([voterId, vote]) => {
                              const voter = room.players.find(p => p.socketId === voterId);
                              return (
                                <div key={voterId} className={`px-3 py-1 rounded-full text-xs font-bold border ${vote === 'YES' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : vote === 'NO' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                                  {voter?.name || 'Unknown'}: {vote}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : !isSpectator ? (
                        <div className="flex flex-col gap-3">
                          <p className="text-slate-400 font-medium text-sm mb-1">Cast your vote based on their word (you can change it until they end the turn):</p>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              onClick={() => sendAction({ type: 'VOTE_GUESS', vote: 'NO' })}
                              className={`py-3 sm:py-4 rounded-xl font-bold transition-all ${gameState.votes[mySocketId] === 'NO' ? 'bg-rose-500 text-white ring-2 ring-rose-300 scale-105 shadow-rose-500/50 shadow-lg' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'}`}
                            >
                              NO
                            </button>
                            <button
                              onClick={() => sendAction({ type: 'VOTE_GUESS', vote: 'MAYBE' })}
                              className={`py-3 sm:py-4 rounded-xl font-bold transition-all ${gameState.votes[mySocketId] === 'MAYBE' ? 'bg-amber-500 text-white ring-2 ring-amber-300 scale-105 shadow-amber-500/50 shadow-lg' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'}`}
                            >
                              MAYBE
                            </button>
                            <button
                              onClick={() => sendAction({ type: 'VOTE_GUESS', vote: 'YES' })}
                              className={`py-3 sm:py-4 rounded-xl font-bold transition-all ${gameState.votes[mySocketId] === 'YES' ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 scale-105 shadow-emerald-500/50 shadow-lg' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'}`}
                            >
                              YES
                            </button>
                          </div>
                          {gameState.votes[mySocketId] && <p className="text-emerald-400 text-sm font-medium mt-2">Vote cast! The asker can see your vote.</p>}
                        </div>
                      ) : (
                        <div className="py-2">
                          <p className="text-slate-300 font-medium">Waiting for players to vote...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {gameState.turnStatus === 'RESULT' && (
                    <div className="text-center animate-in zoom-in-95 fade-in duration-300">
                      <h3 className="text-xl font-black text-indigo-400 mb-4 uppercase tracking-widest bg-indigo-500/10 inline-block px-4 py-2 rounded-xl border border-indigo-500/30">Word Guess</h3>
                      
                      {/* Show the guessed word */}
                      {gameState.guessedWord && (
                        <div className="my-4 p-4 bg-indigo-900/30 border-2 border-indigo-500/40 rounded-2xl">
                          <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-1">{room.players.find(p => p.socketId === gameState.currentTurn)?.name} guesses:</span>
                          <span className="text-3xl font-black text-white">{gameState.guessedWord}</span>
                        </div>
                      )}

                      {/* Vote tallies */}
                      <div className="flex justify-center gap-4 mb-6">
                        <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/30">
                          <span className="block text-2xl font-black">{Object.values(gameState.votes).filter(v => v === 'YES').length}</span>
                          <span className="text-xs uppercase font-bold">YES</span>
                        </div>
                        <div className="bg-rose-500/20 text-rose-400 px-4 py-2 rounded-lg border border-rose-500/30">
                          <span className="block text-2xl font-black">{Object.values(gameState.votes).filter(v => v === 'NO').length}</span>
                          <span className="text-xs uppercase font-bold">NO</span>
                        </div>
                      </div>

                      {/* Voting buttons for non-active players */}
                      {!isMyTurn && !isSpectator && (
                        <div className="mb-6">
                          <p className="text-slate-400 font-medium text-sm mb-3">Is their guess correct?</p>
                          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                            <button
                              onClick={() => sendAction({ type: 'VOTE_GUESS', vote: 'YES' })}
                              className={`py-3 sm:py-4 rounded-xl font-bold transition-all ${gameState.votes[mySocketId] === 'YES' ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 scale-105 shadow-emerald-500/50 shadow-lg' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'}`}
                            >
                              ✅ YES
                            </button>
                            <button
                              onClick={() => sendAction({ type: 'VOTE_GUESS', vote: 'NO' })}
                              className={`py-3 sm:py-4 rounded-xl font-bold transition-all ${gameState.votes[mySocketId] === 'NO' ? 'bg-rose-500 text-white ring-2 ring-rose-300 scale-105 shadow-rose-500/50 shadow-lg' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'}`}
                            >
                              ❌ NO
                            </button>
                          </div>
                          {gameState.votes[mySocketId] && <p className="text-emerald-400 text-sm font-medium mt-2">Vote cast!</p>}
                        </div>
                      )}

                      {/* Active player waits */}
                      {isMyTurn && (
                        <p className="text-slate-400 text-sm mb-4 animate-pulse">Waiting for other players to vote...</p>
                      )}

                      {/* Vote chips */}
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {Object.entries(gameState.votes).map(([voterId, vote]) => {
                          const voter = room.players.find(p => p.socketId === voterId);
                          return (
                            <div key={voterId} className={`px-3 py-1 rounded-full text-xs font-bold border ${vote === 'YES' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                              {voter?.name || 'Unknown'}: {vote}
                            </div>
                          );
                        })}
                      </div>
                      
                      {mySocketId === room.roomHostId && (
                        <button
                          onClick={() => sendAction({ type: 'NEXT_TURN' })}
                          className="w-full sm:max-w-xs mx-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
                        >
                          Continue
                        </button>
                      )}
                    </div>
                  )}

                </div>
                </>)}
              </div>
            )}
            
            {/* FINISHED RESULT */}
            {room.status === RoomStatus.FINISHED && gameState && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 sm:gap-6 min-h-0 py-2 sm:py-4">
                <h4 className="text-base sm:text-lg font-black uppercase text-yellow-400 tracking-widest bg-yellow-500/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-yellow-500/20 mb-2">Game Over</h4>
                
                <div className="text-center p-8 border-2 border-indigo-500/50 bg-indigo-500/10 rounded-2xl animate-in zoom-in w-full max-w-md shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  
                  {gameState.winner ? (
                    <>
                      <h5 className="text-2xl font-bold text-slate-300 mb-2">The Winner is...</h5>
                      <span className="text-5xl font-black block drop-shadow-lg text-white mb-4">
                        {room.players.find(p => p.socketId === gameState.winner)?.name}
                      </span>
                      
                      <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 mt-6">
                        <span className="text-sm text-slate-400 block mb-1">Their Word Was:</span>
                        <span className="text-2xl font-black text-indigo-400">{gameState.playerWords[gameState.winner as string]}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <h5 className="text-2xl font-bold text-slate-300 mb-2">It's a Draw!</h5>
                      <span className="text-5xl block mb-4">🤝</span>
                      <p className="text-slate-400 text-sm">No one guessed their word in {gameState.maxRounds} round{gameState.maxRounds > 1 ? 's' : ''}.</p>
                    </>
                  )}
                </div>
                
                {mySocketId === room.roomHostId && (
                  <div className="w-full max-w-[250px] mt-6">
                    <button 
                      onClick={() => useGameStore.getState().resetRoom()}
                      className="w-full bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-slate-950 font-black text-lg py-4 rounded-xl transition-all uppercase tracking-widest shadow-xl shadow-yellow-900/20"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Players Sidebar */}
          <div className="flex-none h-44 md:h-auto md:flex-1 md:max-w-[260px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-2 sm:p-4 shadow-xl overflow-hidden order-2 md:order-1">
            <div className="flex flex-none items-center justify-between mb-2">
              <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                Players
              </h3>
              <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] text-indigo-400 font-black border border-slate-700">{room.players.length}</span>
            </div>

            <div className="flex-1 overflow-auto border border-slate-800/50 rounded-xl relative bg-slate-950/20">
              <table className="w-full text-sm text-left relative">
                <thead className="text-[10px] text-slate-500 uppercase bg-slate-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-slate-800/80 shadow-sm">
                  <tr>
                    <th className="px-3 py-2 font-bold tracking-wider">Player</th>
                    <th className="px-3 py-2 text-right font-bold tracking-wider">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {room.players.map(p => (
                    <tr key={p.id} className="bg-slate-800/10 hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2 font-medium flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-sm shadow-inner shrink-0 border border-slate-700" title={p.name}>
                          {getAvatarEmoji(p.id)}
                        </span>
                        <div className="flex flex-col">
                          <span className="truncate max-w-[100px] text-slate-300">
                            {p.name} 
                            {p.socketId === useGameStore.getState().socketId && <span className="text-[9px] font-bold text-indigo-400 ml-1">(YOU)</span>}
                          </span>
                          
                          {/* Role Indicators */}
                          {(room.status === RoomStatus.PLAYING || room.status === RoomStatus.FINISHED) && gameState && (
                            <span className="text-[10px] text-slate-500">
                              {p.socketId === gameState.currentTurn ? 'Active Player' : 'Observer'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-400 font-medium align-top">
                        {p.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Guess Word Modal */}
      <AnimatePresence>
        {showGuessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowGuessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-indigo-400 text-center mb-2 uppercase tracking-wider">Guess the Word</h3>
              <p className="text-slate-400 text-sm text-center mb-6">Type what you think your word is. Other players will vote if you're correct!</p>
              
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && guessInput.trim()) {
                    sendAction({ type: 'GUESS_WORD', guess: guessInput.trim() });
                    setShowGuessModal(false);
                    setGuessInput('');
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner mb-4"
                placeholder="Type your guess..."
                autoFocus
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGuessModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (guessInput.trim()) {
                      sendAction({ type: 'GUESS_WORD', guess: guessInput.trim() });
                      setShowGuessModal(false);
                      setGuessInput('');
                    }
                  }}
                  disabled={!guessInput.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  Submit Guess
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HOST_INPUT Word Assignment Modal */}
      <AnimatePresence>
        {showHostWordModal && room && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowHostWordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-indigo-400 text-center mb-2 uppercase tracking-wider">📝 Assign Words</h3>
              <p className="text-slate-400 text-sm text-center mb-6">Type a word for each player. You won't be playing this round.</p>
              
              <div className="flex flex-col gap-4 mb-6">
                {room.players.filter(p => p.socketId !== mySocketId).map(p => (
                  <div key={p.id} className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-400">{p.name}</label>
                    <input
                      type="text"
                      value={hostWordInputs[p.socketId] || ''}
                      onChange={(e) => setHostWordInputs(prev => ({ ...prev, [p.socketId]: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                      placeholder={`Word for ${p.name}`}
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHostWordModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all border border-slate-600"
                >Cancel</button>
                <button
                  onClick={() => {
                    const allFilled = Object.values(hostWordInputs).every(w => w.trim());
                    if (!allFilled) { toast.error('Please fill in all words!'); return; }
                    submitWords(hostWordInputs);
                    setShowHostWordModal(false);
                  }}
                  disabled={!Object.values(hostWordInputs).every(w => w.trim())}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >Start Game</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-slate-950">
        <h1 className="text-4xl font-bold animate-pulse text-slate-400">Loading Lobby...</h1>
      </main>
    }>
      <GameLobby />
      <Toaster 
        position="bottom-center"
        toastOptions={{
          className: 'bg-slate-900! text-slate-200! border! border-slate-800! font-bold! tracking-wide! rounded-xl',
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }} 
      />
      

      {/* Required for framer-motion preserve-3d class */}
      <style dangerouslySetInnerHTML={{__html:`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </Suspense>
  );
}
