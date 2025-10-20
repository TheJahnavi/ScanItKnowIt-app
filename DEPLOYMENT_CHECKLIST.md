# Deployment Checklist

## Pre-deployment Requirements

### 1. Environment Variables Setup

Before deploying to Vercel, ensure the following environment variables are set:

- [ ] `JWT_SECRET` - Generated cryptographic key for JWT token signing
- [ ] `OPENROUTER_API_KEY` - API key for OpenRouter (required for AI functionality)
- [ ] `REDDIT_CLIENT_ID` - Reddit API client ID (optional)
- [ ] `REDDIT_CLIENT_SECRET` - Reddit API client secret (optional)

### 2. Firebase Configuration

- [ ] Firebase Admin SDK credentials configured in Vercel environment
- [ ] Firestore security rules deployed
- [ ] Firestore indexes configured

### 3. Vercel Deployment Setup

- [ ] Project linked to GitHub repository
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables added to Vercel project
- [ ] Serverless function timeout configured (maxDuration: 60)

## Deployment Steps

### 1. Generate JWT Secret

```bash
cd server
node generate-jwt-secret.js
```

Copy the generated secret for use in Vercel.

### 2. Set Vercel Environment Variables

Using Vercel CLI:

```bash
# Login to Vercel (if not already logged in)
vercel login

# Set required environment variables
vercel env add JWT_SECRET production
vercel env add OPENROUTER_API_KEY production

# Set optional environment variables (if using Reddit)
vercel env add REDDIT_CLIENT_ID production
vercel env add REDDIT_CLIENT_SECRET production
```

### 3. Verify Environment Variables

```bash
# Pull environment variables for local testing (do not commit this file)
vercel env pull .env.production.local
```

### 4. Test Build Locally

```bash
cd server
npm run build
```

### 5. Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod
```

## Post-deployment Verification

- [ ] Application loads without errors
- [ ] API endpoints respond correctly
- [ ] Authentication works (registration/login)
- [ ] Rate limiting functions properly
- [ ] AI analysis features work with real API keys
- [ ] Firestore operations work correctly
- [ ] Reddit integration works (if credentials provided)
- [ ] Long-running analyses complete without timeout errors

## Troubleshooting

### Common Issues

1. **Build failures**: Check that all dependencies are correctly installed and TypeScript compiles without errors
2. **Runtime errors**: Verify all environment variables are correctly set in Vercel
3. **Firebase errors**: Ensure Firebase Admin SDK credentials are properly configured
4. **Rate limiting issues**: Check that the rate limiting middleware is properly configured
5. **Timeout errors**: Verify that maxDuration is set correctly in vercel.json

### Useful Commands

```bash
# Check Vercel deployment logs
vercel logs

# View environment variables (values will be masked)
vercel env list

# Redeploy
vercel --prod
```