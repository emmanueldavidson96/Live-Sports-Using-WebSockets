import express from "express";
import { Request, Response } from "express";
import { Application } from "express";

const app: Application = express();
const port = 8000;

app.use(express.json());

app.get("/", (req: Request, res: Response): void => {
  res.send("LiveScores server is running.");
});

app.get("/welcome", (req: Request, res: Response) : void => {
  res.send("Welcome to the LiveScores API!");
});

app.listen(port, (): void => {
  console.log(`Server listening at http://localhost:${port}`);
});
