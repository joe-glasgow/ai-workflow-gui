# AI Workflow GUI - Deployment Guide

## 🌳 Branching Strategy & Environment Mapping

This project uses a **GitFlow-inspired branching strategy** with automatic deployments to AWS environments:

```
┌─────────────┬─────────────────┬─────────────────┬─────────────────┐
│   Branch    │   Environment   │   AWS Profile   │   Auto Deploy   │
├─────────────┼─────────────────┼─────────────────┼─────────────────┤
│  develop    │  Development    │ ai-workflow-dev │       ✅        │
│  staging    │  Staging        │ ai-workflow-stg │       ✅        │
│  main       │  Production     │ ai-workflow-prd │       ✅        │
└─────────────┴─────────────────┴─────────────────┴─────────────────┘
```

## 🚀 Development Workflow

### 1. Feature Development
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make your changes
# ... code, test, commit ...

# Push and create PR to develop
git push origin feature/your-feature-name
```

### 2. Development Deployment
```bash
# Merge PR to develop branch
# This automatically triggers:
# ✅ GitHub Actions workflow
# ✅ Tests run
# ✅ Deploy to Development environment
# ✅ App Runner pulls from 'develop' branch
```

### 3. Staging Promotion
```bash
# When ready for staging testing
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# This automatically triggers:
# ✅ Deploy to Staging environment
# ✅ App Runner pulls from 'staging' branch
```

### 4. Production Promotion
```bash
# When staging is validated and ready for production
git checkout main
git pull origin main
git merge staging
git push origin main

# This automatically triggers:
# ✅ Deploy to Production environment
# ✅ App Runner pulls from 'main' branch
```

## 🏗️ Infrastructure Deployment

### Environment Configuration

Each environment has different configurations:

**Development (`dev`):**
- Cost threshold: $10 (kill switch)
- Database: t3.micro, 7-day backups
- No deletion protection
- Branch: `develop`

**Staging (`staging`):**
- Cost threshold: $25 (kill switch)
- Database: t3.small, 14-day backups
- Limited deletion protection
- Branch: `staging`

**Production (`prod`):**
- Cost threshold: $100 (kill switch)
- Database: t3.medium, 30-day backups
- Full deletion protection
- Branch: `main`

### Manual Infrastructure Deployment

```bash
# Deploy to Development
cd infrastructure
npm run build
cdk deploy --profile ai-workflow-dev --context stage=dev

# Deploy to Staging
cdk deploy --profile ai-workflow-stg --context stage=staging

# Deploy to Production
cdk deploy --profile ai-workflow-prd --context stage=prod
```

## 🔄 App Runner Auto-Deployments

App Runner is configured for automatic deployments:

- **Development**: Watches `develop` branch
- **Staging**: Watches `staging` branch  
- **Production**: Watches `main` branch

When you push to any of these branches, App Runner automatically:
1. Pulls the latest code
2. Runs `npm ci` to install dependencies
3. Runs `npm run build` to build the Next.js app
4. Starts the service with `npm start`

## 🧪 Testing Strategy

### Automated Testing (GitHub Actions)
- Runs on every PR and push
- Unit tests: `npm test`
- Build validation: `npm run build`
- Deployment only proceeds if tests pass

### Environment Testing Flow
1. **Development**: Feature testing, integration testing
2. **Staging**: User acceptance testing, performance testing
3. **Production**: Live environment with real users

## 🔐 GitHub Secrets Configuration

For GitHub Actions to work, configure these secrets in your repository:

```
Repository Settings → Secrets and Variables → Actions
```

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`: AWS access key for deployments
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for deployments

**Environment-Specific Secrets:**
- Development environment: Uses dev AWS credentials
- Staging environment: Uses staging AWS credentials  
- Production environment: Uses production AWS credentials

## 🚨 Emergency Procedures

### Rollback Procedure
```bash
# Quick rollback in App Runner (via AWS Console)
1. Go to App Runner → Services
2. Select your service
3. Click "Deploy" → "Deploy from source"
4. Select previous successful deployment

# Or rollback via Git
git checkout main
git revert <commit-hash>
git push origin main
```

### Kill Switch Activation
If costs exceed thresholds, the Lambda kill switch automatically:
1. Pauses App Runner service
2. Stops RDS database (data preserved)
3. Sends SNS notification

### Manual Cost Control
```bash
# Pause App Runner service
aws apprunner pause-service --service-arn <service-arn>

# Stop RDS database
aws rds stop-db-instance --db-instance-identifier <db-id>
```

## 📊 Monitoring & Observability

### CloudWatch Dashboards
- Application metrics
- Database performance
- Cost tracking
- Error rates

### Billing Alarms
- Development: $5 warning, $10 kill switch
- Staging: $15 warning, $25 kill switch
- Production: $50 warning, $100 kill switch

### Log Aggregation
- App Runner logs in CloudWatch
- Database logs and performance insights
- Lambda function logs

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📝 Best Practices

### Branch Protection Rules
- Require PR reviews for `staging` and `main`
- Require status checks to pass
- Require branches to be up to date

### Commit Messages
Use conventional commits:
```
feat: add user authentication
fix: resolve database connection issue
docs: update deployment guide
```

### Environment Parity
- Keep environments as similar as possible
- Use same Node.js version across all environments
- Test infrastructure changes in dev first

## 🆘 Troubleshooting

### Common Issues

**App Runner Build Failures:**
```bash
# Check build logs in AWS Console
# Verify apprunner.yml configuration
# Ensure all dependencies are in package.json
```

**Database Connection Issues:**
```bash
# Check security group rules
# Verify database credentials in Secrets Manager
# Test connectivity from App Runner
```

**GitHub Actions Failures:**
```bash
# Check workflow logs in GitHub
# Verify AWS credentials are configured
# Ensure CDK context is correct
```

This deployment strategy ensures safe, automated, and cost-controlled deployments across all environments while maintaining high availability and quick rollback capabilities.
