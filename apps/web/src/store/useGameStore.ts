import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { RoomState, RoomStatus, SOCKET_EVENTS, WordCategory } from "@repo/types";
import { toast } from "react-hot-toast";

interface GameState {
  socket: Socket | null;
  connected: boolean;
  room: RoomState | null;
  myName: string;
  socketId: string;
  categories: WordCategory[];
  connect: () => void;
  setName: (name: string) => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  startGame: () => void;
  sendAction: (action: any) => void;
  resetRoom: () => void;
  updateConfig: (config: Partial<RoomState["config"]>) => void;
  submitWords: (playerWords: Record<string, string>) => void;
  submitPlayerWord: (word: string) => void;
  getCategories: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  socket: null,
  connected: false,
  room: null,
  myName: "",
  socketId: "",
  categories: [],

  setName: (name) => set({ myName: name }),

  connect: () => {
    if (get().socket) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socket = io(apiUrl);

    socket.on("connect", () => {
      set({ connected: true, socket, socketId: socket.id });
    });

    socket.on("disconnect", () => {
      set({ connected: false, socketId: "" });
    });

    socket.on(SOCKET_EVENTS.ROOM_STATE_UPDATED, (room: RoomState) => {
      set({ room });
    });

    socket.on(SOCKET_EVENTS.CATEGORIES_LIST, (categories: WordCategory[]) => {
      set({ categories });
    });

    socket.on(SOCKET_EVENTS.ERROR, ({ message }: { message: string }) => {
      toast.error(message);
    });
  },

  createRoom: () => {
    const { socket, myName } = get();
    if (socket && myName) {
      socket.emit("create_room", { name: myName });
    } else if (!myName) {
      toast.error("Please enter your name first");
    }
  },

  joinRoom: (code: string) => {
    const { socket, myName } = get();
    if (socket && myName) {
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, { code, name: myName });
    } else if (!myName) {
      toast.error("Please enter your name first");
    }
  },

  startGame: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit(SOCKET_EVENTS.START_GAME, { code: room.code });
    }
  },

  sendAction: (action: any) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit(SOCKET_EVENTS.GAME_ACTION, { code: room.code, action });
    }
  },

  resetRoom: () => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit(SOCKET_EVENTS.RESET_GAME, { code: room.code });
    }
  },

  updateConfig: (config: Partial<RoomState["config"]>) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit(SOCKET_EVENTS.UPDATE_CONFIG, { code: room.code, config });
    }
  },

  submitWords: (playerWords: Record<string, string>) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit(SOCKET_EVENTS.SUBMIT_WORDS, {
        code: room.code,
        playerWords,
      });
    }
  },

  submitPlayerWord: (word: string) => {
    const { socket, room } = get();
    if (socket && room) {
      socket.emit(SOCKET_EVENTS.SUBMIT_PLAYER_WORD, {
        code: room.code,
        word,
      });
    }
  },

  getCategories: () => {
    const { socket } = get();
    if (socket) {
      socket.emit(SOCKET_EVENTS.GET_CATEGORIES);
    }
  },
}));
