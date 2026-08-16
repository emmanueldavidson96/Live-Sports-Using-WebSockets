import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";
import type { NextFunction, Request, RequestHandler, Response } from "express";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if(!arcjetKey) throw new Error('ARCJET_KEY environment variable is not set');

export const httpArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
        ],
    })
    : null;

export const wsArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 })
        ],
    })
    : null;

export function securityMiddleware(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if(!httpArcjet) {
            next();
            return;
        }
        try {
            const decision = await httpArcjet.protect(req);
            if(decision.isDenied()) {
                if(decision.reason.isRateLimit()) {
                    res.status(429).json({
                        error: 'Too Many Requests'
                    });
                    return;
                }
                res.status(403).json({
                    error: 'Forbidden'
                });
                return;
            }
        } catch (error: unknown) {
            console.error('Arcjet middleware error', error);
            res.status(503).json({
                error: 'Service Unavailable'
            });
            return;
        }

        next();
    }
}
