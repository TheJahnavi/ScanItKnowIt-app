# ScanItKnowIt Deployment Readiness Document

This document serves as the centralized, mandatory checklist for deploying the ScanItKnowIt application, following best practices for deployment information collection and pre-deployment checks.

## Application Information

### Version/Artifact ID
- Application Name: ScanItKnowIt
- Current Version: 1.0.0
- Repository: [GitHub Repository]
- Build Artifact Location: `/dist` directory

### Dependencies
#### Client-side Dependencies
- React 18.3.1 with Vite 7.1.9
- TypeScript 5.6.3
- Tailwind CSS 3.4.17 with shadcn/ui components
- React Query 5.60.5 for server state management
- Wouter 3.3.5 for routing
- Framer Motion 11.13.1 for animations
- Lucide React 0.453.0 for icons
- Zod 3.24.2 for validation

#### Server-side Dependencies
- Express.js 4.21.2
- OpenAI SDK 5.16.0
- Node-fetch 3.3.2
- Multer 2.0.2 for file uploads
- WS 8.18.0 for WebSocket support

#### Development Dependencies
- Cross-env 7.0.3
- TSX 4.19.1 for TypeScript execution
- PostCSS 8.4.47 with Autoprefixer 10.4.21
- Tailwind CSS plugins

### Configuration Files/Variables
- `.env` file with API keys:
  - `OPENROUTER_API_KEY` (required)
  - `REDDIT_CLIENT_ID` (optional)
  - `REDDIT_CLIENT_SECRET` (optional)
- `vercel.json` for deployment configuration
- `client/vite.config.ts` for frontend build configuration
- `server/tsconfig.json` for backend TypeScript configuration
- `tailwind.config.ts` for styling configuration

## Environment Specifications

### Target Environment
- Platform: Vercel (Serverless Functions)
- Region: Automatic (Global Edge Network)
- Environment Name: Production

### Server/OS Requirements
- Runtime: Node.js 18.x or higher
- Memory: Vercel default (Serverless Functions)
- CPU: Vercel default (Serverless Functions)

### Network Requirements
- Ports: 443 (HTTPS) for incoming traffic
- Firewall Rules: Allow outbound HTTPS connections for API integrations
- CORS: Configured for cross-origin requests

### Database Connection
- Storage Type: In-memory with session-based persistence
- Connection Details: None (no external database required)
- Backup Strategy: Manual export of session data

### Storage Requirements
- Static Assets: Served via Vercel CDN
- Uploads: Temporary storage during analysis
- Session Data: In-memory storage (cleared on restart)

## Operational Information

### Monitoring Endpoints/Health Checks
- Health Check Endpoint: `/api/health`
- Application Endpoint: `https://[your-domain].vercel.app/`
- API Endpoint: `https://[your-domain].vercel.app/api/`

### Key Performance Indicators (KPIs)
- Response Time: < 2 seconds for API calls
- Uptime: 99.9%
- Error Rate: < 1%
- Successful Analysis Rate: > 95%

### Alerting Thresholds
- API Response Time > 5 seconds
- Error Rate > 5%
- Failed Builds
- High Memory Usage (> 80%)

### Runbook Link
- Primary Runbook: This document
- Incident Response: Contact deployment team lead
- Rollback Procedure: See Contingency Checks section

## Access & Credentials

### Deployment User Accounts
- Vercel Account: [Team Account]
- GitHub Account: Repository owner access
- CI/CD Integration: Vercel GitHub integration

### Secret/Vault References
- OpenRouter API Key: Stored in Vercel Environment Variables
- Reddit API Credentials: Stored in Vercel Environment Variables (optional)
- API Ninjas Key: Stored in Vercel Environment Variables (optional)

## Essential Pre-Deployment Checks

### 1. Readiness Checks

#### Automated Tests Status
- [ ] Unit tests: Passed
- [ ] Integration tests: Passed
- [ ] End-to-end tests: Passed
- [ ] API contract tests: Passed

#### Versioning and Tagging
- [ ] Application version: 1.0.0
- [ ] Git tag created: v1.0.0
- [ ] Build artifact correctly versioned
- [ ] CHANGELOG.md updated

#### Stakeholder Approval
- [ ] Product Owner sign-off: _____________ Date: ________
- [ ] QA sign-off: _____________ Date: ________
- [ ] Security review (if applicable): _____________ Date: ________

### 2. Environment Parity Checks

#### Target Environment Configuration
- [ ] Node.js version: 18.x (matches staging)
- [ ] OS requirements: Met
- [ ] Library versions: Match staging environment
- [ ] Service availability: Confirmed

#### Database Migration Scripts
- [ ] No database migrations required (using in-memory storage)
- [ ] Data schema validation: Not applicable
- [ ] Performance testing on production-like data: Completed

#### Configuration Variables/Secrets
- [ ] OPENROUTER_API_KEY: Set in Vercel environment
- [ ] REDDIT_CLIENT_ID: Set in Vercel environment (if used)
- [ ] REDDIT_CLIENT_SECRET: Set in Vercel environment (if used)
- [ ] All environment variables validated

### 3. Contingency Checks

#### Full, Tested Backup
- [ ] Source code backup: GitHub repository
- [ ] Environment configuration backup: Vercel project settings
- [ ] Previous deployment backup: Vercel deployment history
- [ ] Manual backup procedure tested

#### Rollback Plan
- [ ] Previous stable version identified: v0.9.0
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging environment
- [ ] Rollback estimated time: < 5 minutes

#### Post-Deployment Smoke Test Script
- [ ] Application loads successfully
- [ ] Camera functionality works
- [ ] Sample product analysis completes
- [ ] Chat interface responds
- [ ] All API endpoints functional

### 4. Communication Checks

#### Team Notifications
- [ ] Support team notified: _____________ Date: ________
- [ ] Engineering team notified: _____________ Date: ________
- [ ] Stakeholders notified: _____________ Date: ________
- [ ] Customer-facing communication sent: _____________ Date: ________

#### Monitoring Dashboards
- [ ] Vercel analytics dashboard: Active
- [ ] Custom monitoring solution: Active
- [ ] Alerting system: Configured and tested
- [ ] On-call team notified: _____________ Date: ________

## Deployment Execution Checklist

### Pre-Deployment
- [ ] Final code commit and push
- [ ] Create Git tag for release
- [ ] Verify all pre-deployment checks completed
- [ ] Notify stakeholders of deployment window

### Deployment Process
- [ ] Trigger deployment via Vercel GitHub integration
- [ ] Monitor build process in Vercel dashboard
- [ ] Verify successful deployment
- [ ] Run smoke tests

### Post-Deployment
- [ ] Update deployment documentation
- [ ] Notify stakeholders of completion
- [ ] Monitor application for 30 minutes
- [ ] Close deployment ticket

For a complete deployment plan with all essential information, see [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md).

---

Document Last Updated: October 15, 2025
Deployment Team Lead: [Team Lead Name]