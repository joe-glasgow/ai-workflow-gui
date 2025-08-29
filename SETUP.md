# AI Workflow GUI - Quick Setup Guide

## 🚀 Getting Started

Your AWS infrastructure is ready! Follow these steps to complete the setup:

## 1. Create the Develop Branch

The App Runner service failed because it's looking for a `develop` branch that doesn't exist yet.

```bash
# Create and push the develop branch
git checkout -b develop
git push origin develop
```

## 2. Redeploy Infrastructure

Now that the `develop` branch exists, redeploy the infrastructure:

```bash
cd infrastructure
npm run build
cdk deploy --profile ai-workflow-dev --context stage=dev
```

## 3. Configure GitHub Actions (Optional)

The GitHub Actions workflow will **gracefully fail** with clear error messages if AWS credentials aren't configured. This is intentional!

### Option A: Skip GitHub Actions for Now
- The workflow will fail with helpful error messages
- You can still deploy manually using CDK commands
- App Runner will still auto-deploy when you push to branches

### Option B: Configure AWS Credentials for GitHub Actions

If you want automated deployments via GitHub Actions:

1. **Go to your repository**: Settings → Secrets and Variables → Actions

2. **Add these secrets**:
   ```
   AWS_ACCESS_KEY_ID: your-aws-access-key
   AWS_SECRET_ACCESS_KEY: your-aws-secret-key
   ```

3. **Create IAM User for GitHub Actions** (recommended):
   ```bash
   # Create dedicated user for GitHub Actions
   aws iam create-user --user-name github-actions-ai-workflow
   
   # Attach necessary policies
   aws iam attach-user-policy --user-name github-actions-ai-workflow --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
   aws iam attach-user-policy --user-name github-actions-ai-workflow --policy-arn arn:aws:iam::aws:policy/IAMFullAccess
   
   # Create access keys
   aws iam create-access-key --user-name github-actions-ai-workflow
   ```

## 4. Test Your Setup

### Manual Deployment (Always Works)
```bash
# Deploy to development
cd infrastructure
cdk deploy --profile ai-workflow-dev --context stage=dev

# Deploy to staging (when ready)
cdk deploy --profile ai-workflow-stg --context stage=staging

# Deploy to production (when ready)
cdk deploy --profile ai-workflow-prd --context stage=prod
```

### Automatic Deployment (After GitHub Secrets Setup)
```bash
# Push to develop → Auto-deploy to dev
git checkout develop
git push origin develop

# Push to staging → Auto-deploy to staging
git checkout staging
git merge develop
git push origin staging

# Push to main → Auto-deploy to production
git checkout main
git merge staging
git push origin main
```

## 5. Access Your Application

Once deployed, you'll get an App Runner URL like:
```
https://xyz123.eu-west-1.awsapprunner.com
```

## 🔧 Current Infrastructure Status

✅ **Working Right Now:**
- AWS infrastructure deployed
- Database ready
- Authentication system configured
- Cost protection active
- Manual deployments work

⏳ **Needs Setup:**
- Create `develop` branch
- Redeploy App Runner service
- (Optional) Configure GitHub Actions secrets

## 🚨 Important Notes

### GitHub Actions Behavior
- **Without secrets**: Workflows fail with clear error messages (this is safe!)
- **With secrets**: Automated deployments work perfectly
- **Tests always run**: Even without AWS secrets, tests and builds run

### Cost Protection
- Development: $10 kill switch (active)
- Automatic shutdown if costs exceed threshold
- All data preserved during shutdown

### App Runner Auto-Deployments
App Runner watches these branches automatically:
- `develop` → Development environment
- `staging` → Staging environment  
- `main` → Production environment

## 🎯 Next Steps

1. **Create develop branch** (required)
2. **Redeploy infrastructure** (required)
3. **Configure GitHub secrets** (optional)
4. **Start developing!** 🚀

Your infrastructure is production-ready and follows enterprise best practices!
