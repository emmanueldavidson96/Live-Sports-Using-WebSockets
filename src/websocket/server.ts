import type { Server as HttpServer } from "node:http";
import type { Server as HttpsServer } from "node:https";
import type { matches } from "../db/schema.js";
import { WebSocket, WebSocketServer } from "ws";

type Match = typeof matches.$inferSelect;

type WebSocketMessage =
  | { type: "welcome" }
  | { type: "match_created"; data: Match };

function sendJson(socket: WebSocket, payload: WebSocketMessage): void {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(wss: WebSocketServer, payload: WebSocketMessage): void {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(
  server: HttpServer | HttpsServer,
): { broadcastMatchCreated: (match: Match) => void } {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket: WebSocket) => {
    sendJson(socket, {
      type: "welcome",
    });
    socket.on("error", (error: Error) => {
      console.error(error);
    });
  });

  function broadcastMatchCreated(match: Match): void {
    broadcast(wss, {
      type: "match_created",
      data: match,
    });
  }

  return { broadcastMatchCreated };
}
