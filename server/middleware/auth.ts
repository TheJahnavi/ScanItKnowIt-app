import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserFromToken, verifyFirebaseIdToken, getUserFromFirebase } from '../services/auth.js';
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

    // Check if it's a Firebase ID token or JWT token
    if (token.length > 100) {
      // Likely a Firebase ID token (longer)
      try {
        // Verify Firebase ID token
        const decoded = await verifyFirebaseIdToken(token);
        
        // Get user from Firebase Auth
        const user = await getUserFromFirebase(decoded.uid);
        
        // Attach user to request
        req.user = user;
        
        logger.debug("Firebase authentication successful", { userId: user.id, username: user.username });
        return next();
      } catch (firebaseError) {
        logger.warn("Firebase authentication failed, trying JWT", { error: (firebaseError as Error).message });
        // Fall through to JWT verification
      }
    }
    
    // Verify JWT token (for compatibility with existing system)
    const decoded = await verifyToken(token);
    
    // Get user from token
    const user = await getUserFromToken(token);
    
    // Attach user to request
    req.user = user;
    
    logger.debug("JWT authentication successful", { userId: user.id, username: user.username });
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

    // Check if it's a Firebase ID token or JWT token
    if (token.length > 100) {
      // Likely a Firebase ID token (longer)
      try {
        // Verify Firebase ID token
        const decoded = await verifyFirebaseIdToken(token);
        
        // Get user from Firebase Auth
        const user = await getUserFromFirebase(decoded.uid);
        
        // Attach user to request
        req.user = user;
        
        logger.debug("Optional Firebase authentication successful", { userId: user.id, username: user.username });
        return next();
      } catch (firebaseError) {
        logger.debug("Optional Firebase authentication failed, trying JWT", { error: (firebaseError as Error).message });
        // Fall through to JWT verification
      }
    }

    // Verify JWT token (for compatibility with existing system)
    const decoded = await verifyToken(token);
    
    // Get user from token
    const user = await getUserFromToken(token);
    
    // Attach user to request
    req.user = user;
    
    logger.debug("Optional JWT authentication successful", { userId: user.id, username: user.username });
    next();
  } catch (error) {
    logger.debug("Optional authentication failed, continuing without user", { error: (error as Error).message });
    // If token is invalid, continue without user
    next();
  }
}