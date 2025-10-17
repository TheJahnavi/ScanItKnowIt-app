# ScanItKnowIt Self-Hosting Guide

This guide provides step-by-step instructions for self-hosting the ScanItKnowIt application on your own server or local machine.

## System Requirements

- Node.js 18.x or higher
- npm or yarn package manager
- SQLite (included in the application)
- At least 2GB RAM
- 500MB free disk space

## Prerequisites

Before you begin, ensure you have the following API keys:

1. **OpenRouter API Key** - Required for AI analysis features
2. **Reddit API Credentials** (optional) - For Reddit review analysis
   - Reddit Client ID
   - Reddit Client Secret
   - Reddit User Agent

For detailed instructions on obtaining and configuring your API keys, see [DEPLOYMENT_WITH_API_KEYS.md](DEPLOYMENT_WITH_API_KEYS.md).

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ScanItKnowIt
```

### 2. Install Dependencies

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

### 3. Configure Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Required - OpenRouter API Key for AI services
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional - Reddit API credentials for review analysis
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=ScanItKnowIt/1.0

# Optional - JWT secret for authentication
JWT_SECRET=your_jwt_secret_here

# Optional - CORS origin for cross-origin requests
CORS_ORIGIN=http://localhost:3001

# Optional - Port configuration
PORT=3001

# Optional - Logging configuration
LOG_TO_CONSOLE=true
LOG_TO_FILE=false

# Optional - Database configuration (for production)
# DATABASE_URL=postgresql://user:password@localhost:5432/scanitknowit
# DATABASE_TYPE=postgresql
```

Also create a `.env` file in the `client` directory:

```env
# Client-side environment variables
VITE_API_BASE_URL=http://localhost:3001/api
```

For detailed instructions on configuring your API keys, see [DEPLOYMENT_WITH_API_KEYS.md](DEPLOYMENT_WITH_API_KEYS.md).

### 4. Database Initialization

The application uses SQLite for data persistence by default. The database file (`scanitknowit.db`) will be automatically created when you start the application.

You can also manually initialize the database:
```bash
npm run init-db
```

**For Production Use**: Consider migrating to PostgreSQL or MySQL for better scalability and persistence. See [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) for detailed instructions.

### 5. Build the Application

```bash
# Build both client and server
npm run build
```

This command will:
- Build the React frontend using Vite
- Compile the TypeScript backend
- Move built files to the appropriate directories

### 6. Start the Application

```bash
# Start the production server
npm run start
```

The application will be available at `http://localhost:3001` (or your configured port).

## Docker Deployment (Optional)

For easier deployment, you can use Docker. The application includes a `docker-compose.yml` file:

```bash
# Build and run the container
docker-compose up
```

Or build and run manually:
```bash
# Build the Docker image
docker build -t scanitknowit .

# Run the container
docker run -p 3001:3001 -v $(pwd)/server:/app/server scanitknowit
```

## Development Mode

For development, you can run the application in development mode:

```bash
# Run in development mode
npm run dev
```

This will start the development server with hot reloading enabled.

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login existing user

### Product Analysis
- `POST /api/analyze-product` - Upload and analyze product image
- `POST /api/analyze-ingredients/:analysisId` - Get ingredient analysis
- `POST /api/analyze-nutrition/:analysisId` - Get nutrition analysis
- `POST /api/analyze-reddit/:analysisId` - Get Reddit reviews

### Chat
- `POST /api/chat/:analysisId` - Chat with AI about product
- `GET /api/chat/:analysisId` - Get chat history

### User Data
- `GET /api/user/analyses` - Get user's analysis history

### Health Monitoring
- `GET /api/health` - Health check endpoint with dependency monitoring

## Data Persistence

The application stores data in a SQLite database (`scanitknowit.db`) by default with the following tables:

1. **users** - User accounts and authentication
2. **product_analyses** - Product analysis results
3. **chat_messages** - Chat conversation history

**For Production Use**: For better scalability and persistence, consider migrating to PostgreSQL or MySQL. See [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) for detailed instructions.

All data is persisted between application restarts.

## Security Considerations

1. **API Keys**: Never commit API keys to version control. Use environment variables.
2. **Passwords**: User passwords are hashed using bcrypt before storage.
3. **Authentication**: JWT tokens are used for secure authentication.
4. **Data Access**: Users can only access their own data.
5. **Rate Limiting**: API endpoints are protected against abuse with rate limiting.
6. **Input Validation**: User inputs are validated to prevent injection attacks.
7. **CORS Configuration**: Proper CORS setup to control cross-origin access.

## Performance Enhancements

The application includes several performance enhancements for production use:

1. **Retry Logic**: External API calls use retry logic with exponential backoff
2. **Circuit Breaker Pattern**: Prevents cascading failures
3. **Rate Limiting**: Protects against API abuse
4. **Efficient Database Queries**: Optimized database operations
5. **Enhanced Logging**: Structured logging for monitoring and debugging

For detailed information about production deployment enhancements, see [PRODUCTION_DEPLOYMENT_ENHANCEMENTS.md](PRODUCTION_DEPLOYMENT_ENHANCEMENTS.md).

## Health Monitoring

The application includes an enhanced health check endpoint that monitors critical dependencies:

- **Server Status**: Basic Express server health
- **Database Connectivity**: Database connection verification
- **External API Status**: OpenAI/OpenRouter and Reddit API connectivity

For detailed information about the health check implementation, see [HEALTH_CHECK_DOCUMENTATION.md](HEALTH_CHECK_DOCUMENTATION.md).

## Troubleshooting

### Common Issues

1. **Build fails**: Ensure you have the latest Node.js version and all dependencies are installed.
2. **Database errors**: Check file permissions for the database directory.
3. **API key errors**: Verify your OpenRouter API key is correct and has sufficient credits.
4. **Port conflicts**: Change the PORT environment variable if 3001 is already in use.
5. **CORS errors**: Ensure CORS_ORIGIN is properly configured for your client domain.

### Logs

Check the console output for error messages. In production, consider implementing proper logging.

## Updating the Application

To update to a new version:

1. Pull the latest changes from the repository
2. Run `npm install` to update dependencies
3. Run `npm run build` to rebuild the application
4. Restart the application with `npm run start`

## Backup and Recovery

Regularly backup the `scanitknowit.db` file to prevent data loss. This file contains all user accounts and analysis data.

For production environments, implement a comprehensive backup strategy for your database. See [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) for recommendations.

## Production Readiness

The application has been enhanced with production-ready features. For detailed information about these enhancements, see:
- [PRODUCTION_READINESS_ENHANCEMENTS.md](PRODUCTION_READINESS_ENHANCEMENTS.md)
- [FINAL_PRODUCTION_READINESS_SUMMARY.md](FINAL_PRODUCTION_READINESS_SUMMARY.md)

## Deployment with API Keys

For detailed instructions on deploying with your API keys, see [DEPLOYMENT_WITH_API_KEYS.md](DEPLOYMENT_WITH_API_KEYS.md).

## Support

For issues or questions, please check the GitHub repository issues or contact the maintainers.