# ScanItKnowIt Deployment Guide with API Keys

This guide provides detailed instructions for deploying the ScanItKnowIt application with your API keys.

## Prerequisites

Before you begin, ensure you have:
1. Node.js 18.x or higher installed
2. The following API keys:
   - OpenRouter API Key (required)
   - Reddit API Credentials (optional)
3. Git installed (if deploying from repository)

## Step 1: Configure Environment Variables

### Option A: Using the .env files (Recommended)

We've created two .env files for you:
1. Root `.env` file for general configuration
2. Server `.env` file for server-specific configuration

Update these files with your actual API keys:

**Root .env file** (`/.env`):
```env
# OpenRouter API Key (required for AI features)
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here

# Reddit API credentials (if using Reddit integration)
REDDIT_CLIENT_ID=your_actual_reddit_client_id
REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
REDDIT_USER_AGENT=ScanItKnowIt/1.0

# JWT Secret for authentication (generate a random string)
JWT_SECRET=your_generated_jwt_secret_here

# Port configuration
PORT=3001
```

**Server .env file** (`/server/.env`):
```env
# OpenRouter API Key for AI services
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here

# Reddit API credentials (optional, for Reddit reviews)
REDDIT_CLIENT_ID=your_actual_reddit_client_id
REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
REDDIT_USER_AGENT=ScanItKnowIt/1.0

# JWT secret for authentication (generate a random string)
JWT_SECRET=your_generated_jwt_secret_here

# Port configuration
PORT=3001
```

### Option B: Using System Environment Variables

Alternatively, you can set environment variables directly in your system:

**On Windows (Command Prompt)**:
```cmd
set OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
set REDDIT_CLIENT_ID=your_actual_reddit_client_id
set REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
set REDDIT_USER_AGENT=ScanItKnowIt/1.0
set JWT_SECRET=your_generated_jwt_secret_here
set PORT=3001
```

**On Windows (PowerShell)**:
```powershell
$env:OPENROUTER_API_KEY="your_actual_openrouter_api_key_here"
$env:REDDIT_CLIENT_ID="your_actual_reddit_client_id"
$env:REDDIT_CLIENT_SECRET="your_actual_reddit_client_secret"
$env:REDDIT_USER_AGENT="ScanItKnowIt/1.0"
$env:JWT_SECRET="your_generated_jwt_secret_here"
$env:PORT="3001"
```

**On macOS/Linux**:
```bash
export OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
export REDDIT_CLIENT_ID=your_actual_reddit_client_id
export REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
export REDDIT_USER_AGENT=ScanItKnowIt/1.0
export JWT_SECRET=your_generated_jwt_secret_here
export PORT=3001
```

## Step 2: Install Dependencies

Navigate to the project root directory and install all dependencies:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

## Step 3: Initialize the Database

Initialize the SQLite database:

```bash
npm run init-db
```

This will create the `scanitknowit.db` file in the server directory with all the necessary tables.

## Step 4: Build the Application

Build both the frontend and backend:

```bash
npm run build
```

This command will:
- Build the React frontend using Vite
- Compile the TypeScript backend
- Move built files to the appropriate directories

## Step 5: Start the Application

Start the production server:

```bash
npm run start
```

The application will be available at `http://localhost:3001` (or your configured port).

## Step 6: Verify Deployment

1. Open your browser and navigate to `http://localhost:3001`
2. You should see the ScanItKnowIt application
3. Test the API endpoints:
   - Health check: `http://localhost:3001/api/health`
   - This should return a JSON response with status information

## Docker Deployment (Alternative)

If you prefer to use Docker, you can deploy using the provided docker-compose.yml:

1. Update the environment variables in docker-compose.yml:
```yaml
version: '3.8'

services:
  scanitknowit:
    build: .
    ports:
      - "3001:3001"
    environment:
      - OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
      - REDDIT_CLIENT_ID=your_actual_reddit_client_id
      - REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
      - REDDIT_USER_AGENT=ScanItKnowIt/1.0
      - JWT_SECRET=your_generated_jwt_secret_here
      - PORT=3001
    volumes:
      - ./server:/app/server
    restart: unless-stopped
```

2. Build and run the container:
```bash
docker-compose up
```

## Troubleshooting

### Common Issues and Solutions

1. **API Key Errors**:
   - Verify your OpenRouter API key is correct and active
   - Check that you've replaced the placeholder values in the .env files
   - Ensure there are no extra spaces or characters in your API keys

2. **Port Conflicts**:
   - If port 3001 is already in use, change the PORT value in your .env files
   - Alternatively, stop the application using that port

3. **Database Initialization Errors**:
   - Ensure you have write permissions in the server directory
   - Check that the database file isn't locked by another process

4. **Build Failures**:
   - Ensure you have the latest Node.js version (18.x or higher)
   - Run `npm install` again to ensure all dependencies are properly installed

5. **Authentication Issues**:
   - Make sure your JWT_SECRET is set and is sufficiently random
   - The JWT secret should be at least 32 characters long for security

### Checking Application Logs

If you encounter issues, check the console output for error messages:
- When running with `npm run start`, all logs will appear in the terminal
- For Docker deployments, use `docker-compose logs` to view logs

## Security Best Practices

1. **API Key Security**:
   - Never commit API keys to version control
   - Use environment variables as demonstrated in this guide
   - Rotate your API keys periodically

2. **JWT Secret**:
   - Generate a strong, random JWT secret
   - Keep it secure and never expose it publicly
   - Consider using a secret management solution in production

3. **File Permissions**:
   - Ensure your .env files have appropriate permissions (not readable by other users)
   - The database file should also have restricted permissions

## Updating API Keys

If you need to update your API keys:

1. Stop the application
2. Update the values in your .env files
3. Restart the application

For Docker deployments:
1. Update the environment variables in docker-compose.yml
2. Run `docker-compose down` to stop the containers
3. Run `docker-compose up` to start with new configuration

## Support

If you continue to experience issues:

1. Check the GitHub repository issues for similar problems
2. Verify all steps in this guide have been followed correctly
3. Ensure your API keys are valid and have sufficient credits (for paid services)
4. Contact the maintainers with detailed information about the issue

## Next Steps

Once your application is successfully deployed:

1. Test all functionality including:
   - User registration and login
   - Product analysis features
   - Chat functionality
   - Reddit review integration (if API keys provided)

2. Consider setting up monitoring and alerting for production use
3. Review the security configuration for your specific deployment environment
4. Set up regular database backups to prevent data loss