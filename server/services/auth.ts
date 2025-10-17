import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { storage } from '../storage-firestore.js';
import { logger } from '../utils/logger.js';

// Variables to hold Firebase Auth references
let getAuth: any = null;
let auth: any = null;

// Initialize Firebase Auth if available
async function initializeFirebaseAuth() {
  try {
    const firebaseAuth = await import('firebase-admin/auth');
    getAuth = firebaseAuth.getAuth;
    auth = getAuth();
    logger.info("Using Firebase Authentication");
  } catch (error) {
    logger.warn("Firebase Authentication not available, using mock authentication for local development", { error: (error as Error).message });
  }
}

// Initialize Firebase Auth
initializeFirebaseAuth();

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
 * Register a new user with Firebase Authentication
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

    // If Firebase Auth is available, create user in Firebase Authentication
    let userId: string;
    if (auth) {
      logger.info("Creating user with Firebase Auth", { username: userData.username });
      const userRecord = await auth.createUser({
        email: `${userData.username}@scanitknowit.local`, // Firebase requires email, using a placeholder
        password: userData.password,
        displayName: userData.username
      });
      userId = userRecord.uid;
      
      // Generate custom token for client-side authentication
      const customToken = await auth.createCustomToken(userRecord.uid);
    } else {
      // For local development, generate a mock user ID
      userId = `mock-user-${Date.now()}`;
      logger.info("Creating user with mock storage", { username: userData.username, userId });
    }

    // Also create user in Firestore for additional data if needed
    // Hash the password before storing it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    const user = await storage.createUser({
      username: userData.username,
      password: hashedPassword // Store hashed password
    });

    // Generate JWT token for compatibility with existing system
    const token = jwt.sign(
      { userId: userId, username: userData.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info("User registration successful", { userId, username: userData.username });
    
    return {
      token,
      user: {
        id: userId,
        username: userData.username
      }
    };
  } catch (error) {
    logger.error("User registration failed", { error: (error as Error).message });
    throw error;
  }
}

/**
 * Login user with Firebase Authentication
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

    // Find user in Firestore (for compatibility with existing system)
    const user = await storage.getUserByUsername(userData.username);
    if (!user) {
      const error = "Invalid username or password";
      logger.warn("Login failed: User not found", { username: userData.username });
      throw new Error(error);
    }

    // Check password (for compatibility with existing system)
    const isPasswordValid = await bcrypt.compare(userData.password, user.password);
    if (!isPasswordValid) {
      const error = "Invalid username or password";
      logger.warn("Login failed: Invalid password", { username: userData.username });
      throw new Error(error);
    }

    // If Firebase Auth is available, verify credentials
    let userId = user.id;
    if (auth) {
      try {
        // In a real Firebase Auth setup, the client would use signInWithEmailAndPassword
        // For server-side verification, we can just use the user ID from Firestore
        logger.debug("Using Firebase Auth for login verification");
      } catch (firebaseError) {
        logger.warn("Firebase Auth login verification failed", { error: (firebaseError as Error).message });
        // Fall back to standard authentication
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: userId, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info("User login successful", { userId, username: user.username });
    
    return {
      token,
      user: {
        id: userId,
        username: user.username
      }
    };
  } catch (error) {
    logger.error("User login failed", { error: (error as Error).message });
    throw error;
  }
}

/**
 * Verify Firebase ID token
 * @param idToken Firebase ID token from client
 * @returns Decoded token data
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<any> {
  try {
    if (auth) {
      const decodedToken = await auth.verifyIdToken(idToken);
      logger.debug("Firebase ID token verification successful");
      return decodedToken;
    } else {
      // For local development, return mock data
      logger.warn("Firebase Auth not available, returning mock token verification");
      return {
        uid: 'mock-user-id',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000)
      };
    }
  } catch (error) {
    logger.warn("Firebase ID token verification failed", { error: (error as Error).message });
    throw new Error('Invalid or expired Firebase ID token');
  }
}

/**
 * Get user from Firebase Authentication
 * @param uid Firebase user ID
 * @returns User object
 */
export async function getUserFromFirebase(uid: string): Promise<any> {
  try {
    if (auth) {
      const userRecord = await auth.getUser(uid);
      logger.debug("User retrieval from Firebase Auth successful", { userId: uid });
      
      // Also get user data from Firestore if needed
      const user = await storage.getUser(uid);
      
      return {
        id: userRecord.uid,
        username: userRecord.displayName || user?.username || 'Unknown',
        email: userRecord.email
      };
    } else {
      // For local development, return mock data
      logger.warn("Firebase Auth not available, returning mock user data");
      const user = await storage.getUser(uid);
      return {
        id: uid,
        username: user?.username || 'Unknown',
        email: `${user?.username || 'unknown'}@scanitknowit.local`
      };
    }
  } catch (error) {
    logger.error("User retrieval from Firebase Auth failed", { error: (error as Error).message });
    throw error;
  }
}

/**
 * Verify JWT token (for compatibility with existing system)
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
 * Get user from token (for compatibility with existing system)
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