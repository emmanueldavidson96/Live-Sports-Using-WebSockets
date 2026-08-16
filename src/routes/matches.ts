import { Request, Response, Router } from "express";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import {createMatchSchema, listMatchesQuerySchema} from "../validation/matches.js";
import {desc} from "drizzle-orm";

const MAX_LIMIT = 100;

export const matchRouter = Router();

matchRouter.get("/", async (_request: Request, response: Response) => {
    const parsed = listMatchesQuerySchema.safeParse(_request.query);
    if(!parsed.success) {
        return response.status(400).json({
            error: 'Invalid query',
            details: parsed.error.issues
        });
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
    try {
        const data = await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit);
        response.status(200).json({
            message: "Matches List",
            data,
        });
    } catch (e) {
        response.status(500).json({
            error: 'Failed to list matches'
        });
    }
});

matchRouter.post("/", async (request: Request, response: Response) => {
  const parsed = createMatchSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      error: "Invalid payload.",
      details: parsed.error.issues,
    });
  }

  const {
    sport,
    homeTeam,
    awayTeam,
    startTime,
    endTime,
    homeScore,
    awayScore,
  } = parsed.data;
  const status = getMatchStatus(startTime, endTime);


  if (!status) {
    return response.status(400).json({
      error: "Invalid match dates.",
      details: "startTime and endTime must be valid dates.",
    });
  }

  try {
    const [event] = await db
      .insert(matches)
      .values({
        sport,
        homeTeam,
        awayTeam,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status,
      })
      .returning();

    if(response.app.locals.broadcastMatchCreated) {
        response.app.locals.broadcastMatchCreated(event);
    }
    return response.status(201).json({ data: event });
  } catch (error) {
    return response.status(500).json({
      error: "Failed to create match",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
