# ScanItKnowIt - Vercel Deployment

This document provides instructions for deploying the ScanItKnowIt application to Vercel with both frontend and backend.

## Project Structure

The project is organized as follows:
```
ScanItKnowIt/
├── client/                 # React frontend (Vite)
│   ├── src/
│   ├── dist/               # Built static files (output of `npm run build`)
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js/Express backend
│   ├── src/                # Backend source
│   ├── package.json
│   └── index.ts            # Backend entry point
├── shared/                 # Shared code (e.g., types, utilities)
├── package.json            # Root package for shared dependencies
└── vercel.json             # Vercel configuration file
```

## Deployment to Vercel

1. **Prepare the Repository**
   - Ensure all changes are committed and pushed to your GitHub repository

2. **Link Your GitHub Repo to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/)
   - Click "Import" → Connect your GitHub account → Select your `ScanItKnowIt` repo

3. **Configure the Project**
   - Vercel will auto-detect the `vercel.json` and build both frontend/backend
   - Set environment variables in the Vercel dashboard:
     - `OPENROUTER_API_KEY`
     - Database connection variables (if using PostgreSQL)
     - Reddit API credentials (if using Reddit integration)

4. **Environment Variables**
   - In Vercel → **Project Settings** → **Environment Variables**, add:
     - `OPENROUTER_API_KEY` (required for AI features)
     - Database connection variables (if applicable)
     - Reddit API credentials (if applicable)
     - `API_NINJAS_KEY` (if using API Ninjas services)

5. **Deploy**
   - Vercel will automatically build and deploy your application
   - The frontend will be available at `https://your-app.vercel.app/`
   - API endpoints will be available at `https://your-app.vercel.app/api/`

## Local Development

To run the application locally:

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. The application will be available at `http://localhost:3001`

## Building for Production

To build the application for production:

1. Build both frontend and backend:
   ```
   npm run build
   ```

2. Start the production server:
   ```
   npm run start
   ```

## API Endpoints

The backend provides the following API endpoints:

- `POST /api/analyze-product` - Analyze a product image
- `POST /api/analyze-ingredients/:analysisId` - Get ingredients analysis
- `POST /api/analyze-nutrition/:analysisId` - Get nutrition analysis
- `POST /api/analyze-reddit/:analysisId` - Get Reddit reviews
- `POST /api/chat/:analysisId` - Chat with AI about the product
- `GET /api/chat/:analysisId` - Get chat history

## Notes

- The frontend is built using Vite and React
- The backend is built using Express.js with TypeScript
- Vercel Functions are used for serverless backend deployment
- Static files are served through Vercel's CDN
- All dependencies are properly configured for Vercel deployment