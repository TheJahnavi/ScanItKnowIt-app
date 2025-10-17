import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from '../storage.js';
import { logger } from '../utils/logger.js';

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'scanitknowit-secret-key';
const JWT_EXPIRES_IN = '7d';

export interface UserRegistrationData {
  username: string;
  password: string;
}

export interface UserLoginData {
  username: string;
  password: string;

}

export interface AuthToken {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

/**
 * Register a new user
 * @param userData User registration data
 * @returns Authentication token and user info
 */
export async function registerUser(userData: UserRegistrationData): Promise<AuthToken> {
  try {
    logger.info("Starting user registration", { username: userData.username });
    
    // Validate input
    if (!userData.username || !userData.password) {
      const error = "Username and password are required";
      logger.warn("Registration validation failed", { error });
      throw new Error(error);
    }

    if (userData.username.length < 3) {
      const error = "Username must be at least 3 characters long";
      logger.warn("Registration validation failed", { error });
      throw new Error(error);
    }

    if (userData.password.length < 6) {
      const error = "Password must be at least 6 characters long";
      logger.warn("Registration validation failed", { error });
      throw new Error(error);
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      const error = "Username already exists";
      logger.warn("Registration failed: Username exists", { username: userData.username });
      throw new Error(error);
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = await storage.createUser({
      username: userData.username,
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info("User registration successful", { userId: user.id, username: user.username });
    
    return {
      token,
      user: {
        id: user.id,
        username: user.username
      }
    };
  } catch (error) {
    logger.error("User registration failed", { error: (error as Error).message });
    throw error;
  }
}

/**
 * Login user
 * @param userData User login data
 * @returns Authentication token and user info
 */
export async function loginUser(userData: UserLoginData): Promise<AuthToken> {
  try {
    logger.info("Starting user login", { username: userData.username });
    
    // Validate input
    if (!userData.username || !userData.password) {
      const error = "Username and password are required";
      logger.warn("Login validation failed", { error });
      throw new Error(error);
    }

    // Find user
    const user = await storage.getUserByUsername(userData.username);
    if (!user) {
      const error = "Invalid username or password";
      logger.warn("Login failed: User not found", { username: userData.username });
      throw new Error(error);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(userData.password, user.password);
    if (!isPasswordValid) {
      const error = "Invalid username or password";
      logger.warn("Login failed: Invalid password", { username: userData.username });
      throw new Error(error);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info("User login successful", { userId: user.id, username: user.username });
    
    return {
      token,
      user: {
        id: user.id,
        username: user.username
      }
    };
  } catch (error) {
    logger.error("User login failed", { error: (error as Error).message });
    throw error;
  }
}

/**
 * Verify JWT token
 * @param token JWT token
 * @returns Decoded token data
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug("Token verification successful");
    return decoded;
  } catch (error) {
    logger.warn("Token verification failed", { error: (error as Error).message });
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user from token
 * @param token JWT token
 * @returns User object
 */
export async function getUserFromToken(token: string): Promise<any> {
  try {
    const decoded = await verifyToken(token);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      const error = "User not found";
      logger.warn("User retrieval failed", { error, userId: decoded.userId });
      throw new Error(error);
    }
    
    logger.debug("User retrieval successful", { userId: user.id, username: user.username });
    return user;
  } catch (error) {
    logger.error("User retrieval failed", { error: (error as Error).message });
    throw error;
  }
}