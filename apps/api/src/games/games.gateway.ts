import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GamesService } from "./games.service";
import { SOCKET_EVENTS, RoomState } from "@repo/types";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gamesService: GamesService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const room = this.gamesService.leaveRoom(client.id);
    if (room) {
      this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, room);
    }
  }

  @SubscribeMessage("create_room")
  handleCreateRoom(
    @MessageBody() data: { name: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.gamesService.createRoom(client.id);
    const updatedRoom = this.gamesService.joinRoom(room.code, {
      id: client.id,
      name: data.name,
      socketId: client.id,
    });

    if (updatedRoom) {
      client.join(updatedRoom.code);
      client.emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, updatedRoom);
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.JOIN_ROOM)
  handleJoinRoom(
    @MessageBody() data: { code: string; name: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.gamesService.joinRoom(data.code.toUpperCase(), {
      id: client.id, // using socketId as temp ID
      name: data.name,
      socketId: client.id,
    });

    if (room) {
      client.join(room.code);
      this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, room);
    } else {
      client.emit(SOCKET_EVENTS.ERROR, { message: "Room not found" });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.START_GAME)
  async handleStartGame(
    @MessageBody() data: { code: string },
    @ConnectedSocket() client: Socket,
  ) {
    const existingRoom = this.gamesService.getRoom(data.code);
    if (!existingRoom) {
      client.emit(SOCKET_EVENTS.ERROR, { message: "Room not found." });
      return;
    }

    const mode = existingRoom.config.wordMode;

    if (mode === 'RANDOM') {
      // Async — query DB for words
      const room = await this.gamesService.startGameRandom(data.code, client.id);
      if (room) {
        this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, room);
      } else {
        client.emit(SOCKET_EVENTS.ERROR, {
          message: "Cannot start game. Not enough words in the selected category or invalid state.",
        });
      }
      return;
    }

    if (mode === 'HOST_INPUT') {
      // HOST_INPUT requires words via SUBMIT_WORDS event, not START_GAME
      client.emit(SOCKET_EVENTS.ERROR, {
        message: "Please submit words for each player first.",
      });
      return;
    }

    // PLAYER_INPUT — enter word collection phase
    const room = this.gamesService.startGame(data.code, client.id);
    if (room) {
      this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, room);
    } else {
      client.emit(SOCKET_EVENTS.ERROR, {
        message: "Cannot start game. Not authorized or invalid state.",
      });
    }
  }

  // HOST_INPUT mode: host submits words for each player
  @SubscribeMessage(SOCKET_EVENTS.SUBMIT_WORDS)
  handleSubmitWords(
    @MessageBody() data: { code: string; playerWords: Record<string, string> },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.gamesService.startGameHostInput(
      data.code,
      client.id,
      data.playerWords,
    );

    if (room) {
      this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, room);
    } else {
      client.emit(SOCKET_EVENTS.ERROR, {
        message: "Cannot start game. Ensure words are provided for all players.",
      });
    }
  }

  // PLAYER_INPUT mode: each player submits their word
  @SubscribeMessage(SOCKET_EVENTS.SUBMIT_PLAYER_WORD)
  handleSubmitPlayerWord(
    @MessageBody() data: { code: string; word: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.gamesService.submitPlayerWord(
      data.code,
      client.id,
      data.word,
    );

    if (result) {
      if (result.error) {
        // Notify the submitter about the duplicate
        client.emit(SOCKET_EVENTS.ERROR, { message: result.error });
      }
      // Broadcast updated room state to all
      this.server
        .to(result.room.code)
        .emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, result.room);
    } else {
      client.emit(SOCKET_EVENTS.ERROR, { message: "Invalid submission." });
    }
  }

  // Get categories from DB
  @SubscribeMessage(SOCKET_EVENTS.GET_CATEGORIES)
  async handleGetCategories(
    @ConnectedSocket() client: Socket,
  ) {
    const categories = await this.gamesService.getCategories();
    client.emit(SOCKET_EVENTS.CATEGORIES_LIST, categories);
  }

  @SubscribeMessage(SOCKET_EVENTS.GAME_ACTION)
  handleGameAction(
    @MessageBody() data: { code: string; action: any },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.gamesService.handleGameAction(
      data.code,
      client.id,
      data.action,
    );

    if (room) {
      this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, room);
    } else {
      client.emit(SOCKET_EVENTS.ERROR, { message: "Invalid action." });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.RESET_GAME)
  handleResetGame(
    @MessageBody() data: { code: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.gamesService.resetGame(data.code, client.id);

    if (room) {
      this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, room);
    } else {
      client.emit(SOCKET_EVENTS.ERROR, {
        message: "Not authorized to reset game or invalid state.",
      });
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.UPDATE_CONFIG)
  handleUpdateConfig(
    @MessageBody() data: { code: string; config: Partial<RoomState["config"]> },
    @ConnectedSocket() client: Socket,
  ) {
    const room = this.gamesService.updateConfig(
      data.code,
      client.id,
      data.config,
    );

    if (room) {
      this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_STATE_UPDATED, room);
    } else {
      client.emit(SOCKET_EVENTS.ERROR, {
        message: "Not authorized to update config or invalid state.",
      });
    }
  }
}
