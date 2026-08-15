import express, { Application, Request, Response } from "express";

const app: Application = express();
const port = 8000;
app.use(express.json());

app.get("/", (request: Request, response: Response): void => {
  response.send("LiveScores server is running.");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

export default app;
