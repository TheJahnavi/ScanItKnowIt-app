# ScanItKnowIt Application Architecture

## Overview

ScanItKnowIt is a full-stack web application that allows users to analyze products by taking photos and receiving AI-powered insights about ingredients, nutrition, and reviews. The application follows a monorepo structure with separate client and server components.

## Directory Structure

```
ScanItKnowIt/
├── .git/                           # Git repository metadata
├── .local/                         # Local development files
├── assets/                         # Static assets
├── attached_assets/                # Additional assets
├── client/                         # React frontend (Vite)
│   ├── src/                        # Client source code
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # UI components (shadcn/ui)
│   │   │   ├── analysis-card.tsx   # Product analysis display component
│   │   │   ├── analysis-screen.tsx # Analysis results screen
│   │   │   ├── camera-screen.tsx   # Camera interface for product scanning
│   │   │   ├── chat-interface.tsx  # AI chat interface
│   │   │   ├── processing-screen.tsx # Processing state display
│   │   │   └── theme-provider.tsx  # Theme management
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── use-camera.tsx      # Camera functionality hook
│   │   │   ├── use-mobile.tsx      # Mobile detection hook
│   │   │   ├── use-theme.tsx       # Theme management hook
│   │   │   └── use-toast.ts        # Toast notification hook
│   │   ├── lib/                    # Utility libraries
│   │   │   ├── queryClient.ts      # React Query client configuration
│   │   │   └── utils.ts            # General utility functions
│   │   ├── pages/                  # Page components
│   │   │   ├── home.tsx            # Main application page
│   │   │   └── not-found.tsx       # 404 page
│   │   ├── types/                  # TypeScript type definitions
│   │   │   └── analysis.ts         # Analysis data types
│   │   ├── App.tsx                 # Main application component
│   │   ├── index.css               # Global CSS styles
│   │   └── main.tsx                # React entry point
│   ├── index.html                  # HTML template
│   ├── package.json                # Client dependencies and scripts
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vite.config.ts              # Vite build configuration
│   └── ...                         # Other configuration files
├── dist/                           # Build output directory
│   ├── client/                     # Client build output
│   │   ├── assets/                 # Compiled CSS and JS assets
│   │   │   ├── index-D-oojegG.css  # Compiled CSS
│   │   │   └── index-DqDLtz1O.js   # Compiled JavaScript
│   │   └── index.html              # Main HTML file
│   ├── api/                        # Server API routes
│   ├── services/                   # Server services
│   ├── index.js                    # Server entry point
│   ├── routes.js                   # Server route definitions
│   ├── storage.js                  # Data storage utilities
│   ├── vercel-entry.js             # Vercel serverless function entry
│   └── vite.js                     # Vite server configuration
├── server/                         # Node.js backend
│   ├── api/                        # API route handlers
│   │   └── index.ts                # API route exports
│   ├── services/                   # External service integrations
│   │   ├── huggingface.ts          # Hugging Face API integration
│   │   ├── openai.ts               # OpenAI API integration
│   │   ├── reddit.ts               # Reddit API integration
│   │   └── websearch.ts            # Web search functionality
│   ├── index.ts                    # Server entry point
│   ├── routes.ts                   # Route definitions
│   ├── storage.ts                  # Data storage utilities
│   ├── vercel-entry.ts             # Vercel serverless entry point
│   ├── vite.ts                     # Vite server configuration
│   ├── package.json                # Server dependencies and scripts
│   └── tsconfig.json               # TypeScript configuration
├── shared/                         # Shared code between client and server
│   └── schema.ts                   # Shared data schemas
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
├── .vercelignore                   # Vercel ignore rules
├── components.json                 # UI component configuration
├── DEPLOYMENT_FIX_SUMMARY.md       # Vercel deployment fix documentation
├── move-dist.js                    # Client build move script
├── move-server-dist.js             # Server build move script
├── package.json                    # Root dependencies and scripts
├── README.md                       # Project documentation
├── replit.md                       # Replit deployment instructions
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # Root TypeScript configuration
├── vercel.json                     # Vercel deployment configuration
└── vite.config.ts                  # Root Vite configuration
```

## Component Architecture

### Frontend (Client)
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: React Query for server state, React hooks for local state
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter (lightweight React router)
- **Camera Integration**: Custom camera hook for product scanning
- **AI Chat Interface**: Custom chat component for interacting with analysis results

### Backend (Server)
- **Framework**: Express.js with TypeScript
- **Deployment**: Vercel Serverless Functions
- **External Services**:
  - OpenAI API for product analysis
  - Hugging Face for specialized AI tasks
  - Reddit API for product reviews
  - Web search APIs for additional information
- **Data Storage**: In-memory storage with session-based persistence
- **API Routes**: RESTful endpoints for all application functionality

### Shared Components
- **Data Schemas**: TypeScript interfaces shared between client and server
- **Build Scripts**: Custom scripts for moving build outputs to correct locations

## Build and Deployment Architecture

### Local Development
1. Client and server are developed separately but in the same repository
2. Client uses Vite's development server with hot reloading
3. Server runs as a standalone Express application
4. Both can be started with `npm run dev`

### Production Build
1. Client is built using `vite build` and outputs to `../dist/client`
2. Server is built using TypeScript compiler and outputs to `server/dist`
3. Custom scripts move server files to root `dist` directory
4. Final structure has all files in `dist` ready for deployment

### Vercel Deployment
1. Uses `vercel.json` configuration with builds array
2. Client build uses `@vercel/static-build` with `base: "client"`
3. Server build uses `@vercel/node` for serverless functions
4. Output is served from `dist` directory
5. Static assets are served from `dist/client`
6. API routes are handled by `dist/vercel-entry.js`

## Data Flow

1. **Product Scanning**: User takes photo → Client processes image → Sent to server
2. **Analysis Request**: Client sends image to server → Server processes through multiple services
3. **AI Processing**: Server calls OpenAI/Hugging Face APIs → Results processed and stored
4. **Review Aggregation**: Server fetches Reddit reviews → Aggregates with analysis
5. **Response**: Server returns complete analysis → Client displays results
6. **Chat Interface**: User asks questions → Client sends to server → Server uses analysis context → Returns AI responses

## Key Files and Their Functions

### Configuration Files
- **vercel.json**: Vercel deployment configuration
- **client/vite.config.ts**: Client build configuration
- **server/tsconfig.json**: Server TypeScript configuration
- **tailwind.config.ts**: Tailwind CSS configuration

### Entry Points
- **client/src/main.tsx**: Client application entry point
- **server/index.ts**: Server application entry point
- **server/vercel-entry.ts**: Vercel serverless function entry point
- **dist/vercel-entry.js**: Compiled Vercel function (generated during build)

### Core Logic Files
- **client/src/pages/home.tsx**: Main application UI
- **server/routes.ts**: API route definitions
- **server/services/*.ts**: External service integrations
- **client/src/components/chat-interface.tsx**: AI chat functionality
- **client/src/hooks/use-camera.tsx**: Camera functionality

### Build and Deployment Scripts
- **move-server-dist.js**: Moves server build output to correct location
- **package.json**: Contains build scripts (`build`, `build:client`, `build:server`)