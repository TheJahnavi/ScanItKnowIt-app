import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// Rate limiter for general API endpoints
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn("Rate limit exceeded for general API", { 
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Rate limiter for authentication endpoints (more restrictive)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn("Rate limit exceeded for authentication", { 
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.'
    });
  }
});

// Rate limiter for analysis endpoints (moderate restriction)
export const analysisRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many analysis requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn("Rate limit exceeded for analysis API", { 
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(429).json({
      error: 'Too many analysis requests, please try again later.'
    });
  }
});