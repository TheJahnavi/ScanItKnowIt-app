# Deployment Guide

This guide explains how to deploy the ScanItKnowIt application to Vercel.

## Prerequisites

1. [Node.js](https://nodejs.org/) (version 20 or higher)
2. [Vercel CLI](https://vercel.com/cli) installed globally
3. API keys for external services

## Required API Keys

Before deploying, you'll need to obtain the following API keys:

1. **OpenRouter API Key** - Required for AI functionality
2. **Reddit API Keys** - Optional, for product review analysis
3. **Firebase Admin SDK Credentials** - For database access

## Deployment Steps

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Generate JWT Secret

```bash
node generate-jwt-secret.js
```

Copy the generated secret for use in Vercel.

### 3. Set Environment Variables in Vercel

Log in to Vercel CLI:

```bash
vercel login
```

Set the required environment variables:

```bash
# Set the mandatory JWT Secret
vercel env add JWT_SECRET production

# Set the mandatory AI Key
vercel env add OPENROUTER_API_KEY production

# (Optional) Set the Reddit Credentials
vercel env add REDDIT_CLIENT_ID production
vercel env add REDDIT_CLIENT_SECRET production
```

### 4. Deploy to Vercel

You can deploy using the Vercel CLI:

```bash
vercel --prod
```

Or use the automated deployment script:

```bash
npm run deploy
```

## Environment Variables

The following environment variables are required for the application to function properly:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Cryptographic key for JWT token signing |
| `OPENROUTER_API_KEY` | Yes | API key for OpenRouter AI services |
| `REDDIT_CLIENT_ID` | No | Reddit API client ID |
| `REDDIT_CLIENT_SECRET` | No | Reddit API client secret |
| `FIREBASE_PROJECT_ID` | Yes* | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes* | Firebase client email |
| `FIREBASE_PRIVATE_KEY` | Yes* | Firebase private key |

*Required for Firebase integration in production

## Firebase Configuration

For Firebase integration, you'll need to set up Firebase Admin SDK credentials in Vercel environment variables:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Set the following environment variables in Vercel:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

## Troubleshooting

### Common Issues

1. **Build failures**: Ensure all TypeScript compiles without errors
2. **Runtime errors**: Verify all environment variables are correctly set
3. **Firebase errors**: Check Firebase Admin SDK credentials
4. **Rate limiting issues**: Verify rate limiting middleware configuration

### Useful Commands

```bash
# Check Vercel deployment logs
vercel logs

# View environment variables (values will be masked)
vercel env list

# Redeploy
vercel --prod
```

## Post-deployment Verification

After deployment, verify that:

1. The application loads without errors
2. API endpoints respond correctly
3. Authentication works (registration/login)
4. Rate limiting functions properly
5. AI analysis features work with real API keys
6. Firestore operations work correctly
7. Reddit integration works (if credentials provided)