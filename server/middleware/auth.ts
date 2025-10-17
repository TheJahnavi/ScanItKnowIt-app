import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserFromToken } from '../services/auth.js';
import { logger } from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authentication middleware
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    logger.debug("Authentication middleware: Checking authentication");
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn("Authentication failed: No valid authorization header");
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = await verifyToken(token);
    
    // Get user from token
    const user = await getUserFromToken(token);
    
    // Attach user to request
    req.user = user;
    
    logger.debug("Authentication successful", { userId: user.id, username: user.username });
    next();
  } catch (error) {
    logger.warn("Authentication failed", { error: (error as Error).message });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication middleware
 * @param req Express request
 * @param res Express response
 * @param next Express next function
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    logger.debug("Optional authentication middleware: Checking authentication");
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.debug("No authorization header, continuing without authentication");
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = await verifyToken(token);
    
    // Get user from token
    const user = await getUserFromToken(token);
    
    // Attach user to request
    req.user = user;
    
    logger.debug("Optional authentication successful", { userId: user.id, username: user.username });
    next();
  } catch (error) {
    logger.debug("Optional authentication failed, continuing without user", { error: (error as Error).message });
    // If token is invalid, continue without user
    next();
  }
}