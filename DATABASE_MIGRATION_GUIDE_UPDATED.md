# Database Migration Guide: From SQLite to Firebase Firestore/PostgreSQL/MySQL

This guide provides instructions for migrating the ScanItKnowIt application from SQLite (development) to either Firebase Firestore, PostgreSQL, or MySQL (production) for better scalability, reliability, and persistence in serverless/container environments.

## Why Migrate from SQLite?

### Limitations of SQLite in Production
1. **Single Process Access**: SQLite allows only one process to access the database at a time
2. **No Network Access**: Cannot be accessed over a network in distributed environments
3. **Limited Concurrency**: Poor performance under high concurrent loads
4. **Volatile Storage**: Database files can be lost in ephemeral environments like Vercel or Docker without persistent volumes

### Benefits of Firebase Firestore
1. **Serverless**: No infrastructure to manage
2. **Auto-scaling**: Automatically scales with your application
3. **Real-time**: Real-time updates and synchronization
4. **NoSQL**: Flexible document-based data model
5. **Global CDN**: Low-latency access from anywhere
6. **Integrated Security**: Built-in authentication and security rules

### Benefits of PostgreSQL/MySQL
1. **High Concurrency**: Handles multiple simultaneous connections efficiently
2. **Network Accessibility**: Can be accessed from multiple application instances
3. **Scalability**: Supports horizontal and vertical scaling
4. **Reliability**: Enterprise-grade reliability with transaction support
5. **Persistence**: Data persists in cloud environments without volume configuration

## Migration Options

### Option 1: Firebase Firestore (Recommended for Serverless)

#### Setup Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Firestore Database
4. Generate a service account key for admin SDK access

#### Update Environment Variables
Add to your `.env` file:
```env
# Firebase configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

#### Code Changes
The application already includes Firestore integration:
- [server/firebase.ts](server/firebase.ts) - Firebase initialization
- [server/storage-firestore.ts](server/storage-firestore.ts) - Firestore storage implementation
- [server/migrate-to-firestore.ts](server/migrate-to-firestore.ts) - Migration script

Update imports to use Firestore storage:
```typescript
// In routes.ts and services/auth.ts
import { storage } from './storage-firestore.js';
```

### Option 2: PostgreSQL

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

### Option 3: MySQL

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

#### For Firebase Firestore
Update `server/package.json`:
```json
{
  "dependencies": {
    // ... existing dependencies
    "firebase-admin": "^12.0.0"
  }
}
```

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

### 2. Update Storage Interface

The application now includes multiple storage implementations:
- [server/storage.ts](server/storage.ts) - SQLite storage (default)
- [server/storage-firestore.ts](server/storage-firestore.ts) - Firebase Firestore storage
- [server/database-postgres.ts](server/database-postgres.ts) - PostgreSQL storage (example)
- [server/database-mysql.ts](server/database-mysql.ts) - MySQL storage (example)

To switch to Firebase Firestore, update imports in:
- [server/routes.ts](server/routes.ts)
- [server/services/auth.ts](server/services/auth.ts)

Change:
```typescript
import { storage } from './storage.js';
```

To:
```typescript
import { storage } from './storage-firestore.js';
```

## Cloud Provider Configuration

### Vercel Configuration
1. Add environment variables in Vercel Dashboard:
   - For Firebase:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
   - For PostgreSQL/MySQL:
     - `DATABASE_URL`
     - `DATABASE_TYPE`

2. Update `vercel.json` if needed:
```json
{
  "env": {
    "FIREBASE_PROJECT_ID": "@firebase_project_id",
    "FIREBASE_CLIENT_EMAIL": "@firebase_client_email",
    "FIREBASE_PRIVATE_KEY": "@firebase_private_key"
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
      # For Firebase
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}
      - FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
      # For PostgreSQL/MySQL (alternative)
      # - DATABASE_URL=${DATABASE_URL}
      # - DATABASE_TYPE=${DATABASE_TYPE}
      - PORT=3001
    restart: unless-stopped
```

## Migration Process

### 1. Data Migration (SQLite to Firebase Firestore)
Use the provided migration script:
```bash
cd server
npx tsx migrate-to-firestore.ts
```

The script will:
1. Read all data from SQLite
2. Transfer users, product analyses, and chat messages to Firestore
3. Preserve all relationships and data integrity

### 2. Testing
1. Test database connectivity:
   ```bash
   npm run test-db-connection
   ```

2. Test application functionality with new database

3. Verify all CRUD operations work correctly

## Best Practices

### 1. Environment-Specific Configuration
- Use different database configurations for development, staging, and production
- Store sensitive connection strings in environment variables or secret management systems

### 2. Monitoring and Logging
- Monitor database performance and connection usage
- Log database operations for debugging and performance analysis

### 3. Backup and Recovery
- Implement regular database backups
- Test backup restoration procedures
- Consider point-in-time recovery options

## Conclusion

Migrating from SQLite to Firebase Firestore, PostgreSQL, or MySQL significantly improves the application's scalability, reliability, and persistence in production environments. Firebase Firestore is particularly well-suited for serverless deployments like Vercel, while PostgreSQL/MySQL offer more traditional relational database features.

The migration process involves:
1. Setting up the new database
2. Updating dependencies and code
3. Configuring environment variables
4. Migrating existing data
5. Testing thoroughly

With these changes, the ScanItKnowIt application will be truly production-ready with robust database persistence and comprehensive health monitoring.

For detailed Firebase setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md).