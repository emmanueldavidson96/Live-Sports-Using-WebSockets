import express from "express";
const app = express();
app.use(express.json());
app.get("/", (_request, response) => {
    response.send("LiveScores server is running.");
});
export default app;
