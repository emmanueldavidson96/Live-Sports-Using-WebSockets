import type { Server as HttpServer } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Server as HttpsServer } from "node:https";
import type { matches } from "../db/schema.js";
import { WebSocket, WebSocketServer } from "ws";
import {wsArcjet} from "../arcjet.js";

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

  wss.on("connection", async (socket: WebSocket, req: IncomingMessage): Promise<void> => {
    if(wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if(decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit() ? 'Rate Limit exceeded' : 'Access denied';
          socket.close(code, reason);
          return;
        }
      } catch(e) {
        console.error('ws connection error', e);
        socket.close(1011, 'Server Security Error');
        return;
      }
    }
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
