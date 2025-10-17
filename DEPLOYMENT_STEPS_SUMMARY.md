# ScanItKnowIt Deployment Steps Summary

This document provides a quick reference for deploying the ScanItKnowIt application with your API keys.

## Quick Deployment Steps

### 1. Prepare Your API Keys
Before deploying, ensure you have:
- OpenRouter API Key (required)
- Reddit API Credentials (optional):
  - Reddit Client ID
  - Reddit Client Secret
  - Reddit User Agent

### 2. Configure Environment Variables
Update the `.env` files with your actual API keys:

**Root .env file** (`/.env`):
```
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
REDDIT_CLIENT_ID=your_actual_reddit_client_id
REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
REDDIT_USER_AGENT=ScanItKnowIt/1.0
JWT_SECRET=your_generated_jwt_secret_here
PORT=3001
```

**Server .env file** (`/server/.env`):
```
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
REDDIT_CLIENT_ID=your_actual_reddit_client_id
REDDIT_CLIENT_SECRET=your_actual_reddit_client_secret
REDDIT_USER_AGENT=ScanItKnowIt/1.0
JWT_SECRET=your_generated_jwt_secret_here
PORT=3001
```

### 3. Install Dependencies
```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install && cd ..

# Server dependencies
cd server && npm install && cd ..
```

### 4. Initialize Database
```bash
npm run init-db
```

### 5. Build Application
```bash
npm run build
```

### 6. Start Application
```bash
npm run start
```

### 7. Access Application
Open your browser to `http://localhost:3001`

## Docker Deployment Alternative

### 1. Update docker-compose.yml
Ensure environment variables are set in your shell or update the docker-compose.yml file directly.

### 2. Build and Run
```bash
docker-compose up
```

## Verification Steps

### 1. Check Environment Variables
```bash
cd server
npm run test-env
```

### 2. Verify Health Endpoint
Visit `http://localhost:3001/api/health` - should return status information.

### 3. Test User Registration
Use the registration form or API endpoint to create a test user.

### 4. Test Product Analysis
Upload a product image to test the analysis functionality.

## Troubleshooting

### Common Issues
1. **API Key Errors**: Verify keys are correct and not expired
2. **Port Conflicts**: Change PORT in .env files if 3001 is in use
3. **Database Permissions**: Ensure write access to server directory
4. **Build Failures**: Check Node.js version (18.x or higher required)

### Support Resources
- [DEPLOYMENT_WITH_API_KEYS.md](DEPLOYMENT_WITH_API_KEYS.md) - Detailed deployment guide
- [SELF_HOSTING_GUIDE.md](SELF_HOSTING_GUIDE.md) - Comprehensive self-hosting instructions
- [README.md](README.md) - Main project documentation

## Security Notes

1. Never commit API keys to version control
2. Generate a strong JWT secret (at least 32 characters)
3. Use HTTPS in production environments
4. Regularly rotate API keys
5. Backup the database file regularly

## Next Steps After Deployment

1. Test all application features
2. Set up monitoring and alerting
3. Configure automated backups
4. Review security settings for your environment
5. Consider performance optimization for high-traffic scenarios