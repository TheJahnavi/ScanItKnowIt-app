# Comprehensive Technical Documentation - ScanItKnowIt

## 1. Codebase & Infrastructure

### Source Control
- **Platform**: Git hosted on GitHub at https://github.com/TheJahnavi/ScanItKnowIt-app.git
- **Branching Strategy**: Main branch deployment model with direct-replacement deployments via Vercel's GitHub integration
- **Recent Activity**: Recent commits focused on production readiness enhancements, Firebase integration, and build error fixes

### Technology Stack

#### Frontend (Client)
- **Primary Language**: TypeScript
- **Framework**: React with Vite
- **State Management**: React Query for server state, React hooks for local state
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter (lightweight React router)
- **Build Tool**: Vite
- **Key Libraries**:
  - @radix-ui/react-* components for UI
  - @tanstack/react-query for data fetching
  - lucide-react for icons
  - framer-motion for animations
  - recharts for data visualization

#### Backend (Server)
- **Primary Language**: TypeScript
- **Framework**: Express.js
- **Runtime**: Node.js (v22.x)
- **Deployment**: Vercel Serverless Functions
- **Key Libraries**:
  - firebase-admin for Firebase integration
  - openai for AI service integration
  - bcrypt for password hashing
  - jsonwebtoken for authentication
  - multer for file uploads
  - express-rate-limit for rate limiting

#### Database
- **Primary**: Firebase Firestore (replacing SQLite for production)
- **Fallback**: SQLite (for development/local)
- **Authentication**: Firebase Authentication with JWT fallback

#### Caching
- **Mechanism**: In-memory storage with session-based persistence
- **Note**: No external caching system (Redis/Memcached) currently implemented

### Architecture
- **Structure**: Monorepo with separate client and server components
- **Communication**: RESTful API endpoints
- **Pattern**: Client-server architecture with serverless backend deployment

#### Main Components
1. **Client Application**: React/Vite frontend for user interface
2. **API Server**: Express.js backend with REST endpoints
3. **Data Layer**: Firebase Firestore with SQLite fallback
4. **External Services**: OpenAI, Reddit API, Hugging Face API
5. **Authentication**: Firebase Authentication with JWT fallback

### Deployment & Environment
- **Platform**: Vercel with Zero Config deployment
- **Environments**: 
  - Development (local with mock services)
  - Production (Vercel with Firebase)
- **CI/CD**: GitHub integration with automatic deployments on push to main branch
- **Build Process**: 
  - Client: `vite build` → `dist/client/`
  - Server: TypeScript compilation → `server/dist/` → moved to `dist/`

## 2. Quality & Maintainability

### Test Coverage
- **Current State**: Limited automated test suite
- **Coverage**: Basic smoke tests and manual validation
- **Testing Tools**: Custom test scripts in `server/comprehensive-test.js`

### Documentation
- **Available Documentation**:
  - README.md with setup and deployment instructions
  - Application architecture documentation
  - Firebase integration guides
  - Database migration guides
  - Deployment plans and checklists
  - API documentation in code comments
- **API Specifications**: REST endpoints documented in README.md

### Technical Debt
- **Known Issues**:
  - Limited automated test coverage
  - In-memory storage in some implementations
  - Some dependency conflicts in package management
- **Performance Considerations**:
  - No external caching implemented
  - Session-based data persistence (data cleared on restart in some configurations)

### Dependencies
- **External Services**:
  - OpenRouter API (required for AI features)
  - Reddit API (optional for product reviews)
  - Firebase services (authentication, database, storage)
- **Third-Party Libraries**:
  - React ecosystem (UI components, state management)
  - Express.js ecosystem (middleware, routing)
  - AI service SDKs (OpenAI, Hugging Face)
  - Utility libraries (bcrypt, nanoid, multer)

## 3. Monitoring & Operations

### Logging
- **Implementation**: Custom logger in `server/utils/logger.ts`
- **Features**: 
  - Multiple log levels (debug, info, warn, error)
  - Structured logging with metadata
  - API request logging
  - Error tracking with context
- **Storage**: Console output (Vercel captures logs automatically)

### Error Reporting
- **Implementation**: Custom error handling middleware
- **Features**:
  - Structured error responses
  - Error logging with context
  - Proper HTTP status codes
  - Stack trace protection in production

### Performance
- **Monitoring**: Health check endpoint at `/api/health`
- **Metrics**: Response times, uptime, dependency status
- **Tools**: Built-in health monitoring with dependency checks
- **APM**: No dedicated APM tool (New Relic, Datadog) currently implemented

## 4. Setup & Access

### Local Setup
1. **Prerequisites**:
   - Node.js v22.x
   - npm or pnpm package manager
   - Git for version control

2. **Installation Process**:
   ```bash
   # Clone repository
   git clone https://github.com/TheJahnavi/ScanItKnowIt-app.git
   cd ScanItKnowIt-app
   
   # Install dependencies
   npm install
   
   # Initialize database (SQLite for local development)
   npm run init-db
   ```

3. **Environment Variables** (`.env` file):
   ```bash
   OPENROUTER_API_KEY=your_openrouter_api_key
   JWT_SECRET=your_jwt_secret_key
   # Firebase credentials (optional for local dev)
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   ```

4. **Development Server**:
   ```bash
   npm run dev
   # Application available at http://localhost:3001
   ```

### Access Requirements
- **Code Access**: GitHub repository access
- **Documentation**: All documentation included in repository
- **Environment Access**: 
  - Vercel account for production deployment
  - Firebase account for database/authentication
  - OpenRouter API key for AI services
  - Reddit API credentials (optional)
- **Database Access**: 
  - Firebase Console for Firestore management
  - Local SQLite file for development

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login existing user

### Product Analysis
- `POST /api/analyze-product` - Analyze a product image
- `POST /api/analyze-ingredients/:analysisId` - Get ingredients analysis
- `POST /api/analyze-nutrition/:analysisId` - Get nutrition analysis
- `POST /api/analyze-reddit/:analysisId` - Get Reddit reviews

### Chat
- `POST /api/chat/:analysisId` - Chat with AI about the product
- `GET /api/chat/:analysisId` - Get chat history

### User Data
- `GET /api/user/analyses` - Get user's analysis history

### Health & Monitoring
- `GET /api/health` - Health check endpoint with dependency monitoring

## Deployment Process

### Vercel Deployment
1. **Preparation**:
   - Ensure all changes are committed and pushed to GitHub
   - Set environment variables in Vercel dashboard

2. **Deployment**:
   - Vercel automatically builds and deploys on push to main branch
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Post-Deployment**:
   - Run smoke tests: `npm run smoke-test`
   - Verify health endpoint: `GET /api/health`

### Self-Hosting
1. **Build Process**:
   ```bash
   npm run build
   ```

2. **Start Server**:
   ```bash
   npm run start
   ```

3. **Environment Configuration**:
   - Set all required environment variables
   - Configure database connections
   - Set up reverse proxy (nginx, Apache) if needed

## Security Features

### Authentication
- JWT token-based authentication
- Firebase Authentication integration
- Password hashing with bcrypt
- Rate limiting on authentication endpoints

### Data Protection
- Input validation and sanitization
- Secure storage of passwords
- CORS configuration
- Firebase security rules for data isolation

### API Security
- Rate limiting on all endpoints
- Authentication middleware for protected routes
- Error handling without information leakage
- Secure environment variable management

## Recent Enhancements

### Firebase Integration
- Complete migration from SQLite to Firebase Firestore
- Firebase Authentication implementation
- Security rules for data protection
- Migration scripts for existing data

### Production Readiness
- Enhanced health check endpoint with dependency monitoring
- Improved error handling and logging
- Performance optimizations
- Security enhancements
- CORS configuration
- Client-side environment variable support

### Build System
- Resolved PostCSS build errors
- Updated to latest CSS build tools
- Node.js engine requirements specified
- Cross-platform compatibility improvements

This documentation provides a comprehensive overview of the ScanItKnowIt application's technical architecture, setup requirements, and operational characteristics.