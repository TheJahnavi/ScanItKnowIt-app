# ScanItKnowIt Complete Deployment Guide

This comprehensive guide provides everything you need to deploy the ScanItKnowIt application with your API keys.

## Overview

The ScanItKnowIt application is now fully production-ready with:
- Backend data persistence using SQLite
- User authentication with JWT tokens
- API key security with environment variables
- Rate limiting and retry logic for resilience
- Docker support for easy deployment
- Comprehensive documentation

## Prerequisites

Before deployment, you'll need:
1. Node.js 18.x or higher
2. The following API keys:
   - OpenRouter API Key (required for AI features)
   - Reddit API Credentials (optional, for Reddit reviews)

## Step-by-Step Deployment Process

### Step 1: Generate a Secure JWT Secret

Run the provided script to generate a secure JWT secret:

```bash
cd server
node generate-jwt-secret.js
```

Copy the generated secret for use in your environment configuration.

### Step 2: Configure Environment Variables

Create and update the environment files with your actual API keys:

**Root .env file** (`/.env`):
```env
# OpenRouter API Key (required for AI features)
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here

# Reddit API credentials (if using Reddit integration)
REDDIT_CLIENT_ID=your_actual_reddit_client_id
REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
REDDIT_USER_AGENT=ScanItKnowIt/1.0

# JWT Secret (use the generated secret from Step 1)
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

# JWT secret (use the generated secret from Step 1)
JWT_SECRET=your_generated_jwt_secret_here

# Port configuration
PORT=3001
```

### Step 3: Verify Environment Configuration

Test that your environment variables are properly configured:

```bash
cd server
node test-env.js
```

You should see a message indicating that all required environment variables are set.

### Step 4: Install Dependencies

Install all required dependencies:

```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install && cd ..

# Server dependencies
cd server && npm install && cd ..
```

### Step 5: Initialize the Database

Initialize the SQLite database:

```bash
npm run init-db
```

This will create the `scanitknowit.db` file with all necessary tables.

### Step 6: Build the Application

Build both frontend and backend:

```bash
npm run build
```

### Step 7: Start the Application

Start the production server:

```bash
npm run start
```

### Step 8: Access the Application

Open your browser and navigate to `http://localhost:3001`

## Docker Deployment Alternative

If you prefer to use Docker:

1. Ensure your environment variables are set in your shell or update `docker-compose.yml` directly
2. Build and run with Docker:

```bash
docker-compose up
```

## Testing Your Deployment

### Verify Health Endpoint
Visit `http://localhost:3001/api/health` - you should see status information.

### Test User Registration
1. Visit the application in your browser
2. Click "Sign Up" and create a test user account
3. Log in with your new account

### Test Product Analysis
1. Upload a product image using the camera or file upload feature
2. Verify that the analysis completes successfully

## Security Best Practices

1. **API Key Security**:
   - Never commit API keys to version control
   - Use environment variables as demonstrated
   - Rotate API keys periodically

2. **JWT Secret**:
   - Use the generated secure secret
   - Never share the JWT secret publicly
   - Consider using a secret management solution in production

3. **File Permissions**:
   - Ensure your .env files have appropriate permissions
   - The database file should also have restricted permissions

## Troubleshooting Common Issues

### API Key Errors
- Verify your OpenRouter API key is correct and active
- Check that you've replaced placeholder values in .env files
- Ensure there are no extra spaces or characters in your API keys

### Port Conflicts
- If port 3001 is already in use, change the PORT value in your .env files
- Alternatively, stop the application using that port

### Database Initialization Errors
- Ensure you have write permissions in the server directory
- Check that the database file isn't locked by another process

### Build Failures
- Ensure you have the latest Node.js version (18.x or higher)
- Run `npm install` again to ensure all dependencies are properly installed

## Monitoring and Maintenance

### Health Checks
The application includes a health check endpoint at `/api/health` that provides:
- Application status
- Timestamp
- Uptime information

### Error Monitoring
All errors are logged to the console with detailed information for debugging.

### Database Backups
Regularly backup the `scanitknowit.db` file to prevent data loss.

## Updating the Application

To update to a new version:

1. Pull the latest changes from the repository
2. Run `npm install` to update dependencies
3. Run `npm run build` to rebuild the application
4. Restart the application with `npm run start`

## Support Resources

For additional help, refer to these documentation files:
- [DEPLOYMENT_WITH_API_KEYS.md](DEPLOYMENT_WITH_API_KEYS.md) - Detailed deployment instructions
- [SELF_HOSTING_GUIDE.md](SELF_HOSTING_GUIDE.md) - Comprehensive self-hosting guide
- [README.md](README.md) - Main project documentation
- [DEPLOYMENT_STEPS_SUMMARY.md](DEPLOYMENT_STEPS_SUMMARY.md) - Quick reference deployment steps

## Conclusion

Your ScanItKnowIt application is now ready for production use. With the security enhancements, robust error handling, and comprehensive documentation, you can confidently deploy and maintain this application in a production environment.

The application includes all the features you requested:
✅ Backend Data Persistence (Database)
✅ User Authentication & State Management
✅ API Key Security & Robust Error Handling
✅ Deployment & Self-Hosting Configuration

Enjoy using ScanItKnowIt!