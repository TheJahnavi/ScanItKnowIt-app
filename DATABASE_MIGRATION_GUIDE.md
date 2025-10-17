# Database Migration Guide: From SQLite to PostgreSQL/MySQL

This guide provides instructions for migrating the ScanItKnowIt application from SQLite (development) to PostgreSQL or MySQL (production) for better scalability, reliability, and persistence in serverless/container environments.

## Why Migrate from SQLite?

### Limitations of SQLite in Production
1. **Single Process Access**: SQLite allows only one process to access the database at a time
2. **No Network Access**: Cannot be accessed over a network in distributed environments
3. **Limited Concurrency**: Poor performance under high concurrent loads
4. **Volatile Storage**: Database files can be lost in ephemeral environments like Vercel or Docker without persistent volumes

### Benefits of PostgreSQL/MySQL
1. **High Concurrency**: Handles multiple simultaneous connections efficiently
2. **Network Accessibility**: Can be accessed from multiple application instances
3. **Scalability**: Supports horizontal and vertical scaling
4. **Reliability**: Enterprise-grade reliability with transaction support
5. **Persistence**: Data persists in cloud environments without volume configuration

## Migration Options

### Option 1: PostgreSQL (Recommended)

#### Setup PostgreSQL Database
1. **Create Database**:
   ```sql
   CREATE DATABASE scanitknowit;
   CREATE USER scanitknowit_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE scanitknowit TO scanitknowit_user;
   ```

2. **Create Tables**:
   ```sql
   -- Users table
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   -- Product analyses table
   CREATE TABLE product_analyses (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     product_name TEXT NOT NULL,
     product_summary TEXT,
     extracted_text JSONB,
     image_url TEXT,
     ingredients_data JSONB,
     nutrition_data JSONB,
     reddit_data JSONB,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users (id)
   );
   
   -- Chat messages table
   CREATE TABLE chat_messages (
     id TEXT PRIMARY KEY,
     analysis_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     message TEXT NOT NULL,
     response TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (analysis_id) REFERENCES product_analyses (id),
     FOREIGN KEY (user_id) REFERENCES users (id)
   );
   ```

#### Update Environment Variables
Add to your `.env` file:
```env
DATABASE_URL=postgresql://scanitknowit_user:your_secure_password@localhost:5432/scanitknowit
DATABASE_TYPE=postgresql
```

### Option 2: MySQL

#### Setup MySQL Database
1. **Create Database**:
   ```sql
   CREATE DATABASE scanitknowit;
   CREATE USER 'scanitknowit_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON scanitknowit.* TO 'scanitknowit_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Create Tables**:
   ```sql
   -- Users table
   CREATE TABLE users (
     id VARCHAR(255) PRIMARY KEY,
     username VARCHAR(255) UNIQUE NOT NULL,
     password TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   -- Product analyses table
   CREATE TABLE product_analyses (
     id VARCHAR(255) PRIMARY KEY,
     user_id VARCHAR(255) NOT NULL,
     product_name TEXT NOT NULL,
     product_summary TEXT,
     extracted_text JSON,
     image_url TEXT,
     ingredients_data JSON,
     nutrition_data JSON,
     reddit_data JSON,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users (id)
   );
   
   -- Chat messages table
   CREATE TABLE chat_messages (
     id VARCHAR(255) PRIMARY KEY,
     analysis_id VARCHAR(255) NOT NULL,
     user_id VARCHAR(255) NOT NULL,
     message TEXT NOT NULL,
     response TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (analysis_id) REFERENCES product_analyses (id),
     FOREIGN KEY (user_id) REFERENCES users (id)
   );
   ```

#### Update Environment Variables
Add to your `.env` file:
```env
DATABASE_URL=mysql://scanitknowit_user:your_secure_password@localhost:3306/scanitknowit
DATABASE_TYPE=mysql
```

## Code Changes Required

### 1. Update Database Dependencies

#### For PostgreSQL
Update `server/package.json`:
```json
{
  "dependencies": {
    // ... existing dependencies
    "pg": "^8.11.0",
    "pg-hstore": "^2.3.4"
  }
}
```

#### For MySQL
Update `server/package.json`:
```json
{
  "dependencies": {
    // ... existing dependencies
    "mysql2": "^3.6.0"
  }
}
```

### 2. Update Database Service

Create a new database service file `server/database-postgres.ts` or `server/database-mysql.ts`:

#### For PostgreSQL (`server/database-postgres.ts`)
```typescript
import { Pool } from 'pg';
import { nanoid } from 'nanoid';

// Define interfaces for our data models
export interface User {
  id: string;
  username: string;
  password: string;
  createdAt: Date;
}

export interface ProductAnalysis {
  id: string;
  userId: string;
  productName: string;
  productSummary: string;
  extractedText: any;
  imageUrl: string | null;
  ingredientsData: any | null;
  nutritionData: any | null;
  redditData: any | null;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  analysisId: string;
  userId: string;
  message: string;
  response: string;
  createdAt: Date;
}

export class PostgresDatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });
  }

  async initialize() {
    // Test connection
    const client = await this.pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('PostgreSQL database connection established');
    } finally {
      client.release();
    }
  }

  // User operations
  async createUser(username: string, password: string): Promise<User> {
    const client = await this.pool.connect();
    try {
      const id = nanoid();
      const createdAt = new Date();
      
      const result = await client.query(
        'INSERT INTO users (id, username, password, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, username, password, createdAt]
      );
      
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  // Product analysis operations
  async createProductAnalysis(analysis: Omit<ProductAnalysis, 'id' | 'createdAt'>): Promise<ProductAnalysis> {
    const client = await this.pool.connect();
    try {
      const id = nanoid();
      const createdAt = new Date();
      
      const result = await client.query(
        `INSERT INTO product_analyses 
         (id, user_id, product_name, product_summary, extracted_text, image_url, ingredients_data, nutrition_data, reddit_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          id,
          analysis.userId,
          analysis.productName,
          analysis.productSummary,
          analysis.extractedText,
          analysis.imageUrl,
          analysis.ingredientsData,
          analysis.nutritionData,
          analysis.redditData,
          createdAt
        ]
      );
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        productName: row.product_name,
        productSummary: row.product_summary,
        extractedText: row.extracted_text,
        imageUrl: row.image_url,
        ingredientsData: row.ingredients_data,
        nutritionData: row.nutrition_data,
        redditData: row.reddit_data,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async getProductAnalysis(id: string): Promise<ProductAnalysis | undefined> {
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM product_analyses WHERE id = $1', [id]);
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        productName: row.product_name,
        productSummary: row.product_summary,
        extractedText: row.extracted_text,
        imageUrl: row.image_url,
        ingredientsData: row.ingredients_data,
        nutritionData: row.nutrition_data,
        redditData: row.reddit_data,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async updateProductAnalysis(id: string, updates: Partial<Omit<ProductAnalysis, 'id' | 'createdAt'>>): Promise<void> {
    const client = await this.pool.connect();
    try {
      const fields: string[] = [];
      const values: any[] = [];
      const placeholders: string[] = [];
      
      if (updates.productName !== undefined) {
        fields.push('product_name');
        values.push(updates.productName);
        placeholders.push(`$${fields.length}`);
      }
      
      if (updates.productSummary !== undefined) {
        fields.push('product_summary');
        values.push(updates.productSummary);
        placeholders.push(`$${fields.length}`);
      }
      
      if (updates.extractedText !== undefined) {
        fields.push('extracted_text');
        values.push(updates.extractedText);
        placeholders.push(`$${fields.length}`);
      }
      
      if (updates.imageUrl !== undefined) {
        fields.push('image_url');
        values.push(updates.imageUrl);
        placeholders.push(`$${fields.length}`);
      }
      
      if (updates.ingredientsData !== undefined) {
        fields.push('ingredients_data');
        values.push(updates.ingredientsData);
        placeholders.push(`$${fields.length}`);
      }
      
      if (updates.nutritionData !== undefined) {
        fields.push('nutrition_data');
        values.push(updates.nutritionData);
        placeholders.push(`$${fields.length}`);
      }
      
      if (updates.redditData !== undefined) {
        fields.push('reddit_data');
        values.push(updates.redditData);
        placeholders.push(`$${fields.length}`);
      }
      
      if (fields.length === 0) return;
      
      values.push(id);
      
      await client.query(
        `UPDATE product_analyses SET ${fields.map((field, i) => `${field} = ${placeholders[i]}`).join(', ')} WHERE id = $${fields.length + 1}`,
        values
      );
    } finally {
      client.release();
    }
  }

  // Chat message operations
  async createChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const client = await this.pool.connect();
    try {
      const id = nanoid();
      const createdAt = new Date();
      
      const result = await client.query(
        'INSERT INTO chat_messages (id, analysis_id, user_id, message, response, created_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, message.analysisId, message.userId, message.message, message.response, createdAt]
      );
      
      const row = result.rows[0];
      return {
        id: row.id,
        analysisId: row.analysis_id,
        userId: row.user_id,
        message: row.message,
        response: row.response,
        createdAt: new Date(row.created_at)
      };
    } finally {
      client.release();
    }
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM chat_messages WHERE analysis_id = $1 ORDER BY created_at ASC',
        [analysisId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        analysisId: row.analysis_id,
        userId: row.user_id,
        message: row.message,
        response: row.response,
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  }

  // Get user's analysis history
  async getUserAnalyses(userId: string): Promise<ProductAnalysis[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM product_analyses WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        productName: row.product_name,
        productSummary: row.product_summary,
        extractedText: row.extracted_text,
        imageUrl: row.image_url,
        ingredientsData: row.ingredients_data,
        nutritionData: row.nutrition_data,
        redditData: row.reddit_data,
        createdAt: new Date(row.created_at)
      }));
    } finally {
      client.release();
    }
  }
}

// Export a singleton instance
export const postgresDb = new PostgresDatabaseService();
```

### 3. Update Storage Interface

Update `server/storage.ts` to support multiple database types:

```typescript
import { db, User, ProductAnalysis, ChatMessage } from './database.js';
import { postgresDb } from './database-postgres.js'; // For PostgreSQL
// import { mysqlDb } from './database-mysql.js'; // For MySQL

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string }): Promise<User>;
  
  createProductAnalysis(analysis: any): Promise<ProductAnalysis>;
  getProductAnalysis(id: string): Promise<ProductAnalysis | undefined>;
  updateProductAnalysis(id: string, updates: any): Promise<void>;
  
  createChatMessage(message: any): Promise<ChatMessage>;
  getChatMessages(analysisId: string): Promise<ChatMessage[]>;
  
  getUserAnalyses(userId: string): Promise<ProductAnalysis[]>;
}

export class DatabaseStorage implements IStorage {
  private getDatabase() {
    const dbType = process.env.DATABASE_TYPE;
    
    if (dbType === 'postgresql') {
      return postgresDb;
    } else if (dbType === 'mysql') {
      // return mysqlDb;
    }
    
    // Default to SQLite
    return db;
  }

  async getUser(id: string): Promise<User | undefined> {
    try {
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('getUser' in database) {
        return await (database as any).getUser(id);
      }
      // Fallback to SQLite
      return await db.getUser(id);
    } catch (error) {
      logger.error("Storage: Failed to get user by ID", { error: (error as Error).message, userId: id });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('getUserByUsername' in database) {
        return await (database as any).getUserByUsername(username);
      }
      // Fallback to SQLite
      return await db.getUserByUsername(username);
    } catch (error) {
      logger.error("Storage: Failed to get user by username", { error: (error as Error).message, username });
      throw error;
    }
  }

  async createUser(userData: { username: string; password: string }): Promise<User> {
    try {
      logger.info("Storage: Creating user", { username: userData.username });
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('createUser' in database) {
        return await (database as any).createUser(userData.username, userData.password);
      }
      // Fallback to SQLite
      return await db.createUser(userData.username, userData.password);
    } catch (error) {
      logger.error("Storage: Failed to create user", { error: (error as Error).message, username: userData.username });
      throw error;
    }
  }

  async createProductAnalysis(analysis: any): Promise<ProductAnalysis> {
    try {
      logger.info("Storage: Creating product analysis", { userId: analysis.userId });
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('createProductAnalysis' in database) {
        return await (database as any).createProductAnalysis(analysis);
      }
      // Fallback to SQLite
      return await db.createProductAnalysis(analysis);
    } catch (error) {
      logger.error("Storage: Failed to create product analysis", { error: (error as Error).message, userId: analysis.userId });
      throw error;
    }
  }

  async getProductAnalysis(id: string): Promise<ProductAnalysis | undefined> {
    try {
      logger.debug("Storage: Getting product analysis", { analysisId: id });
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('getProductAnalysis' in database) {
        return await (database as any).getProductAnalysis(id);
      }
      // Fallback to SQLite
      return await db.getProductAnalysis(id);
    } catch (error) {
      logger.error("Storage: Failed to get product analysis", { error: (error as Error).message, analysisId: id });
      throw error;
    }
  }

  async updateProductAnalysis(id: string, updates: any): Promise<void> {
    try {
      logger.info("Storage: Updating product analysis", { analysisId: id });
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('updateProductAnalysis' in database) {
        return await (database as any).updateProductAnalysis(id, updates);
      }
      // Fallback to SQLite
      return await db.updateProductAnalysis(id, updates);
    } catch (error) {
      logger.error("Storage: Failed to update product analysis", { error: (error as Error).message, analysisId: id });
      throw error;
    }
  }

  async createChatMessage(message: any): Promise<ChatMessage> {
    try {
      logger.info("Storage: Creating chat message", { analysisId: message.analysisId });
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('createChatMessage' in database) {
        return await (database as any).createChatMessage(message);
      }
      // Fallback to SQLite
      return await db.createChatMessage(message);
    } catch (error) {
      logger.error("Storage: Failed to create chat message", { error: (error as Error).message, analysisId: message.analysisId });
      throw error;
    }
  }

  async getChatMessages(analysisId: string): Promise<ChatMessage[]> {
    try {
      logger.debug("Storage: Getting chat messages", { analysisId });
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('getChatMessages' in database) {
        return await (database as any).getChatMessages(analysisId);
      }
      // Fallback to SQLite
      return await db.getChatMessages(analysisId);
    } catch (error) {
      logger.error("Storage: Failed to get chat messages", { error: (error as Error).message, analysisId });
      throw error;
    }
  }
  
  async getUserAnalyses(userId: string): Promise<ProductAnalysis[]> {
    try {
      logger.debug("Storage: Getting user analyses", { userId });
      const database = this.getDatabase();
      // For PostgreSQL/MySQL, we need to check if the method exists
      if ('getUserAnalyses' in database) {
        return await (database as any).getUserAnalyses(userId);
      }
      // Fallback to SQLite
      return await db.getUserAnalyses(userId);
    } catch (error) {
      logger.error("Storage: Failed to get user analyses", { error: (error as Error).message, userId });
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
```

## Cloud Provider Configuration

### Vercel Configuration
1. Add environment variables in Vercel Dashboard:
   - `DATABASE_URL`: Your PostgreSQL/MySQL connection string
   - `DATABASE_TYPE`: postgresql or mysql

2. Update `vercel.json` if needed:
```json
{
  "env": {
    "DATABASE_URL": "@database_url",
    "DATABASE_TYPE": "postgresql"
  }
}
```

### Docker Configuration
Update `docker-compose.yml`:
```yaml
version: '3.8'

services:
  scanitknowit:
    build: .
    ports:
      - "3001:3001"
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - REDDIT_CLIENT_ID=${REDDIT_CLIENT_ID}
      - REDDIT_CLIENT_SECRET=${REDDIT_CLIENT_SECRET}
      - REDDIT_USER_AGENT=${REDDIT_USER_AGENT}
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
      - DATABASE_TYPE=${DATABASE_TYPE}
      - PORT=3001
    depends_on:
      - database
    restart: unless-stopped

  database:
    image: postgres:15
    environment:
      POSTGRES_DB: scanitknowit
      POSTGRES_USER: scanitknowit_user
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Migration Process

### 1. Data Migration (SQLite to PostgreSQL/MySQL)
1. Export data from SQLite:
   ```bash
   sqlite3 scanitknowit.db .dump > sqlite_dump.sql
   ```

2. Convert SQLite dump to PostgreSQL/MySQL format (manual or using tools)

3. Import data to PostgreSQL/MySQL:
   ```bash
   psql -U scanitknowit_user -d scanitknowit -f postgresql_dump.sql
   ```

### 2. Testing
1. Test database connectivity:
   ```bash
   npm run test-db-connection
   ```

2. Test application functionality with new database

3. Verify all CRUD operations work correctly

## Best Practices

### 1. Connection Pooling
- Use connection pooling to manage database connections efficiently
- Configure appropriate pool sizes based on expected load

### 2. Environment-Specific Configuration
- Use different database configurations for development, staging, and production
- Store sensitive connection strings in environment variables or secret management systems

### 3. Monitoring and Logging
- Monitor database performance and connection usage
- Log database operations for debugging and performance analysis

### 4. Backup and Recovery
- Implement regular database backups
- Test backup restoration procedures
- Consider point-in-time recovery options

## Conclusion

Migrating from SQLite to PostgreSQL or MySQL significantly improves the application's scalability, reliability, and persistence in production environments. The enhanced health check endpoint ensures that all critical dependencies are monitored, providing better visibility into the application's operational status.

The migration process involves:
1. Setting up the new database
2. Updating dependencies and code
3. Configuring environment variables
4. Migrating existing data
5. Testing thoroughly

With these changes, the ScanItKnowIt application will be truly production-ready with robust database persistence and comprehensive health monitoring.