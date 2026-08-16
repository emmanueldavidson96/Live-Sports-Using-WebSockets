import express, { Application, Request, Response } from "express";
import { matchRouter } from "./routes/matches.js";
import http from 'http';
import { attachWebSocketServer } from "./websocket/server.js";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "0.0.0.0";

const app: Application = express();
const server = http.createServer(app);

app.use(express.json());

app.get("/", (request: Request, response: Response): void => {
  response.send("LiveScores server is running.");
});

app.get("/api/v1", (request: Request, response: Response): void => {
  response.send("Welcome to Live scores API");
});

app.use('/api/v1/matches', matchRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
server.listen(PORT, HOST, () => {
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(`WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`);
});

export default app;
