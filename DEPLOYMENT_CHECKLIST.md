# ScanItKnowIt Deployment Checklist

This checklist should be completed before, during, and after each deployment to ensure a smooth release process.

## Pre-Deployment Checklist

### Code and Environment Preparation
- [ ] Pull latest changes from main branch
- [ ] Verify all tests pass locally (`npm run check`)
- [ ] Run deployment readiness verification (`npm run verify-deployment`)
- [ ] Update version number in package.json if needed
- [ ] Create Git tag for release (e.g., v1.0.1)
- [ ] Verify DEPLOYMENT_READINESS_DOCUMENT.md is up to date
- [ ] Check that all environment variables are configured in Vercel

### Communication
- [ ] Notify team of deployment window
- [ ] Confirm maintenance page/notice is ready (if needed)
- [ ] Schedule rollback window if deployment fails
- [ ] Ensure support team is aware of deployment

## Deployment Process

### Vercel Deployment
- [ ] Push code to GitHub main branch
- [ ] Monitor Vercel build logs
- [ ] Verify build completes successfully
- [ ] Check Vercel preview URL for initial verification
- [ ] Promote to production if preview looks good

### Manual Deployment (if applicable)
- [ ] Run build process (`npm run build`)
- [ ] Verify dist/ directory is created correctly
- [ ] Deploy files to server
- [ ] Restart application server
- [ ] Verify application is running

## Post-Deployment Verification

### Immediate Checks (First 5 minutes)
- [ ] Application loads at main URL
- [ ] Run smoke tests (`npm run smoke-test`)
- [ ] Verify health check endpoint (`/api/health`)
- [ ] Test core functionality (camera, analysis, chat)
- [ ] Check error logs for any issues

### Extended Monitoring (First 30 minutes)
- [ ] Monitor application performance
- [ ] Check for any error spikes in logs
- [ ] Verify API response times are acceptable
- [ ] Confirm no 500 errors in application
- [ ] Test with real product images

### Long-term Monitoring (First 24 hours)
- [ ] Monitor usage metrics
- [ ] Check for any user-reported issues
- [ ] Verify all external API integrations working
- [ ] Monitor resource usage (memory, CPU)
- [ ] Review application logs for anomalies

## Rollback Procedure

If critical issues are discovered after deployment:

1. **Immediate Actions:**
   - [ ] Notify team and stakeholders
   - [ ] Document the issue with screenshots/logs
   - [ ] Determine if immediate rollback is required

2. **Rollback Steps:**
   - [ ] Revert to previous Git tag in Vercel
   - [ ] Or redeploy previous working build
   - [ ] Verify application functionality
   - [ ] Monitor for resolution of the issue

3. **Post-Rollback:**
   - [ ] Communicate status to users
   - [ ] Schedule investigation of the issue
   - [ ] Update documentation with lessons learned
   - [ ] Plan next deployment with fix

## Contact Information

### Key Personnel
- Deployment Team Lead: [Name and Contact]
- Support Lead: [Name and Contact]
- Engineering Lead: [Name and Contact]

### Important Links
- Application URL: https://[your-app].vercel.app/
- Vercel Dashboard: [Link to Vercel project]
- GitHub Repository: [Link to repository]
- Monitoring Dashboard: [Link to monitoring]

For a complete deployment plan with all essential information, see [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md).

---

**Deployment Date:** _________
**Version Deployed:** _________
**Deployed By:** _________
**Verification Completed By:** _________

**Post-Deployment Status:**
- [ ] Successful
- [ ] Issues identified (see notes)
- [ ] Rollback performed

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________
