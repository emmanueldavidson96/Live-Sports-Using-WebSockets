import express, { Application, Request, Response } from "express";
import { matchRouter } from "./routes/matches.js";

const app: Application = express();
const port = 8000;
app.use(express.json());

app.get("/", (request: Request, response: Response): void => {
  response.send("LiveScores server is running.");
});

app.get("/api/v1", (request: Request, response: Response): void => {
  response.send("Welcome to Live scores API");
});

app.use('/api/v1/matches', matchRouter);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

export default app;
