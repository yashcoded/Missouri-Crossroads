# Deploying Missouri Crossroads to AWS Amplify

This guide will walk you through deploying your Next.js application to AWS Amplify.

---

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS Account with admin access
- AWS CLI installed and configured (optional but recommended)

### 2. Required AWS Services
Before deploying to Amplify, ensure these are set up:

- ✅ **S3 Bucket** - For CSV data storage
  - Name: `mr-crossroads-bucket` (or your bucket name)
  - Public read access for metadata files
  - CORS configured

- ✅ **DynamoDB Tables** - For user data and notes
  - `missouri-crossroads-users`
  - `missouri-crossroads-notes`
  - `missouri-crossroads-admin-logs`

- ✅ **Cognito User Pool** - For authentication
  - User Pool ID
  - App Client ID
  - App Client Secret

- ✅ **IAM User/Role** - For AWS SDK access
  - Permissions: S3, DynamoDB, Cognito
  - Access Key ID and Secret Access Key

### 3. Google APIs
- Google Maps API Key (with domain restrictions)
- Google Places API Key

---

## 🚀 Deployment Methods

### Method 1: Deploy via Amplify Console (Recommended)

#### Step 1: Connect Your Repository

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify/
   - Click **"New app"** → **"Host web app"**

2. **Connect to GitHub**
   - Select **"GitHub"** as source
   - Click **"Authorize AWS Amplify"**
   - Select your repository: `yashcoded/Missouri-Crossroads`
   - Select branch: `main` or `dev_1`
   - Click **"Next"**

#### Step 2: Configure Build Settings

Amplify should auto-detect Next.js. Verify these settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install --frozen-lockfile
    build:
      commands:
        - pnpm build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

**Custom Build Settings (if needed):**
- **Package manager:** pnpm
- **Build command:** `pnpm build`
- **Output directory:** `.next`
- **Node version:** 20.x

Click **"Next"**

#### Step 3: Add Environment Variables

⚠️ **CRITICAL:** Add these environment variables in Amplify Console:

**Navigate to:** App Settings → Environment variables

**Add these variables:**

```bash
# AWS Configuration (Public - Safe for client-side)
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your_user_pool_id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your_client_id
NEXT_PUBLIC_DYNAMODB_USERS_TABLE=missouri-crossroads-users
NEXT_PUBLIC_DYNAMODB_NOTES_TABLE=missouri-crossroads-notes
NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE=missouri-crossroads-admin-logs

# AWS Secrets (Server-side ONLY - NEVER use NEXT_PUBLIC_ prefix!)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=mr-crossroads-bucket
COGNITO_CLIENT_SECRET=your_client_secret

# Google Maps API
NEXT_PUBLIC_MAP_KEY=your_google_maps_api_key
NEXT_PUBLIC_PLACES_KEY=your_google_places_api_key
```

⚠️ **Important:**
- Use **NEXT_PUBLIC_** prefix ONLY for values safe to expose to browser
- AWS credentials should NOT have NEXT_PUBLIC_ prefix
- Store sensitive values as "Secret" type in Amplify

#### Step 4: Deploy

1. Review all settings
2. Click **"Save and deploy"**
3. Amplify will:
   - Clone your repository
   - Install dependencies with pnpm
   - Run build
   - Deploy to CDN
   - Provide a URL like: `https://dev_1.xxxxx.amplifyapp.com`

**First deployment takes ~5-10 minutes**

---

### Method 2: Deploy via AWS Amplify CLI

#### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

#### Step 2: Initialize Amplify in Your Project

```bash
cd /Users/oss/Desktop/missouri-crossroads/Missouri-Crossroads

# Initialize Amplify
amplify init

# Follow prompts:
# ? Enter a name for the project: missouricrossroads
# ? Initialize the project with the above configuration? Yes
# ? Select the authentication method: AWS profile
# ? Please choose the profile you want to use: default
```

#### Step 3: Add Hosting

```bash
# Add hosting with Amplify Console
amplify add hosting

# Select: Hosting with Amplify Console
# Select: Manual deployment
```

#### Step 4: Publish

```bash
amplify publish
```

This will:
- Build your app locally
- Upload to Amplify
- Deploy to production

---

### Method 3: Deploy via GitHub Actions (CI/CD)

Add deployment step to your `.github/workflows/ci.yml`:

```yaml
  deploy:
    runs-on: ubuntu-latest
    needs: [test, build, e2e-tests]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Deploy to Amplify
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-2
    
    - name: Trigger Amplify deployment
      run: |
        aws amplify start-job --app-id ${{ secrets.AMPLIFY_APP_ID }} --branch-name main --job-type RELEASE
```

---

## 🔧 AWS Amplify Configuration

### Custom Build Specification

Create `amplify.yml` in your project root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "Installing pnpm..."
        - npm install -g pnpm@10
        - echo "Installing dependencies..."
        - pnpm install --frozen-lockfile
    build:
      commands:
        - echo "Building Next.js application..."
        - pnpm build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
      - .pnpm-store/**/*

# Enable SSR and API routes
backend:
  phases:
    build:
      commands:
        - echo "Backend build complete"
```

### Build Settings in Amplify Console

**App settings → Build settings:**

```yaml
Package manager: pnpm
Base directory: (leave empty)
Build command: pnpm build
Output directory: .next
Node version: 20
```

---

## 🔐 Environment Variables Setup

### In AWS Amplify Console

**App Settings → Environment variables → Manage variables**

**Add each variable:**

| Variable Name | Value | Type |
|--------------|-------|------|
| NEXT_PUBLIC_AWS_REGION | us-east-2 | PlainText |
| NEXT_PUBLIC_COGNITO_USER_POOL_ID | your_pool_id | PlainText |
| NEXT_PUBLIC_COGNITO_CLIENT_ID | your_client_id | PlainText |
| NEXT_PUBLIC_DYNAMODB_USERS_TABLE | missouri-crossroads-users | PlainText |
| NEXT_PUBLIC_DYNAMODB_NOTES_TABLE | missouri-crossroads-notes | PlainText |
| NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE | missouri-crossroads-admin-logs | PlainText |
| AWS_ACCESS_KEY_ID | AKIA... | **Secret** |
| AWS_SECRET_ACCESS_KEY | your_secret | **Secret** |
| S3_BUCKET_NAME | mr-crossroads-bucket | PlainText |
| COGNITO_CLIENT_SECRET | your_secret | **Secret** |
| NEXT_PUBLIC_MAP_KEY | AIza... | **Secret** |
| NEXT_PUBLIC_PLACES_KEY | AIza... | **Secret** |

⚠️ **Important:** Mark sensitive values as "Secret" type!

---

## 🛠️ AWS Resources Setup

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://mr-crossroads-bucket --region us-east-2

# Set public read for metadata folder
aws s3api put-bucket-acl --bucket mr-crossroads-bucket --acl public-read

# Configure CORS
aws s3api put-bucket-cors --bucket mr-crossroads-bucket --cors-configuration file://cors.json
```

**cors.json:**
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://*.amplifyapp.com", "http://localhost:3000"],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 2. Create DynamoDB Tables

```bash
# Users table
aws dynamodb create-table \
  --table-name missouri-crossroads-users \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-2

# Notes table
aws dynamodb create-table \
  --table-name missouri-crossroads-notes \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-2

# Admin logs table
aws dynamodb create-table \
  --table-name missouri-crossroads-admin-logs \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-2
```

### 3. Create Cognito User Pool

**Via AWS Console:**
1. Go to **Amazon Cognito**
2. Click **"Create user pool"**
3. Configure:
   - Sign-in options: Email
   - Password requirements: As needed
   - MFA: Optional
4. Create app client
5. Save User Pool ID and Client ID

---

## 🌐 Custom Domain Setup (Optional)

### Add Custom Domain in Amplify

1. **App Settings → Domain management**
2. Click **"Add domain"**
3. Select your domain from Route 53 or add external domain
4. Follow DNS configuration steps
5. Wait for SSL certificate provisioning (~15 minutes)

### Update Google Maps API Restrictions

Once you have your Amplify URL:
1. Go to **Google Cloud Console → APIs & Services → Credentials**
2. Click on your API key
3. Under **"Application restrictions"**:
   - Select **"HTTP referrers"**
   - Add: `https://*.amplifyapp.com/*`
   - Add: `https://yourdomain.com/*` (if using custom domain)

---

## 🔄 Continuous Deployment

### Automatic Deployments

Amplify automatically deploys when you push to connected branch:

```bash
# Any push to main/dev_1 triggers deployment
git push origin main
```

### Branch Deployments

Set up preview environments for branches:
1. **App Settings → Branch deployments**
2. Connect additional branches (e.g., `develop`, `staging`)
3. Each branch gets its own URL

### Pull Request Previews

Enable PR previews:
1. **App Settings → Previews**
2. Enable **"Pull request previews"**
3. Every PR gets a temporary preview URL

---

## 🐛 Troubleshooting

### Build Fails

**Issue:** Build fails with module errors
**Solution:**
```yaml
# In amplify.yml, ensure pnpm is installed first
preBuild:
  commands:
    - npm install -g pnpm@10
    - pnpm install --frozen-lockfile
```

**Issue:** Out of memory during build
**Solution:** Increase build memory in App Settings → Build image settings

### Environment Variables Not Working

**Issue:** App can't connect to AWS services
**Solution:**
1. Verify all environment variables are set
2. Check variable names (case-sensitive!)
3. Ensure secrets don't have `NEXT_PUBLIC_` prefix
4. Redeploy after adding variables

### API Routes Not Working

**Issue:** 404 on API routes
**Solution:** Ensure Next.js is in SSR mode (not static export)
```javascript
// next.config.ts - should NOT have:
output: 'export' // Remove this if present
```

### S3 Access Denied

**Issue:** Can't fetch CSV from S3
**Solution:**
1. Check IAM permissions for access keys
2. Verify S3 bucket policy allows your Amplify app
3. Check CORS configuration

---

## 📊 Monitoring & Logs

### View Logs in Amplify Console

1. **App → Branch (e.g., main)**
2. Click on deployment
3. View build logs
4. View deployed app logs

### CloudWatch Logs

For API routes:
1. Go to **CloudWatch → Log groups**
2. Find: `/aws/lambda/your-app-name`
3. View real-time logs

### Metrics

Monitor in Amplify Console:
- Page views
- Requests
- Data transfer
- Build duration

---

## 💰 Cost Estimation

### AWS Amplify Hosting
- **Build minutes:** $0.01 per build minute
- **Hosting:** $0.15 per GB served
- **Free tier:** 1000 build minutes/month, 15 GB served/month

### Supporting Services
- **S3:** ~$1-5/month (depending on storage/requests)
- **DynamoDB:** Pay per request (~$1-10/month for moderate use)
- **Cognito:** Free for <50,000 users
- **Google Maps:** $200/month free credit, then pay per use

**Estimated total:** $5-20/month for moderate traffic

---

## 🔒 Security Best Practices

### 1. IAM Permissions

Create dedicated IAM user for Amplify:

```bash
# Attach these policies:
- AmazonS3FullAccess (or restrict to specific bucket)
- AmazonDynamoDBFullAccess (or restrict to specific tables)
- AmazonCognitoPowerUser
```

**Better:** Create custom policy with least privilege:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::mr-crossroads-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-2:*:table/missouri-crossroads-*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:*"
      ],
      "Resource": "arn:aws:cognito-idp:us-east-2:*:userpool/*"
    }
  ]
}
```

### 2. Rotate Credentials

Before deploying:
```bash
# Create new IAM access keys
# Delete old ones that may have been exposed
# Update environment variables in Amplify
```

### 3. Enable Access Logs

```bash
# Enable Amplify access logs
aws amplify update-app --app-id YOUR_APP_ID --enable-branch-auto-build
```

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All AWS resources created (S3, DynamoDB, Cognito)
- [ ] IAM user created with proper permissions
- [ ] Environment variables documented
- [ ] Google Maps API keys ready
- [ ] Domain name ready (optional)
- [ ] All tests passing locally: `pnpm test`
- [ ] Build succeeds locally: `pnpm build`
- [ ] AWS credentials rotated (if previously exposed)

---

## 🚀 Deployment Steps (Complete)

### Step-by-Step:

```bash
# 1. Ensure you're on the right branch
git checkout main  # or dev_1

# 2. Pull latest changes
git pull origin main

# 3. Verify tests pass
pnpm test

# 4. Verify build works
pnpm build

# 5. Push to trigger deployment (if connected)
git push origin main
```

### In AWS Amplify Console:

1. **Connect repository** (one-time)
2. **Add environment variables** (one-time)
3. **Configure build settings** (one-time)
4. **Deploy** - Click "Deploy" or push to trigger auto-deploy
5. **Verify** - Visit your Amplify URL

---

## 🧪 Post-Deployment Verification

### 1. Check Deployment Status

```bash
# Via CLI
aws amplify list-apps
aws amplify get-app --app-id YOUR_APP_ID
```

### 2. Test the Deployed App

Visit your Amplify URL and verify:
- ✅ Home page loads
- ✅ Map page loads with pins
- ✅ 700+ locations showing (not just 91)
- ✅ Authentication works
- ✅ CSV upload works (if authenticated)
- ✅ No console errors
- ✅ API routes work

### 3. Check AWS Services

Verify connectivity:
```bash
# Check CloudWatch logs for API routes
# Check DynamoDB for user data
# Check S3 for CSV files
# Check Cognito for user pool
```

---

## 📝 Environment-Specific Configuration

### Development
- Branch: `dev_1`
- URL: `https://dev_1.xxxxx.amplifyapp.com`
- Debug logs enabled

### Production
- Branch: `main`
- URL: `https://main.xxxxx.amplifyapp.com` or custom domain
- Debug logs disabled (already configured!)

---

## 🔄 Updating Your Deployed App

### Automatic Updates (Recommended)

Once connected to GitHub:
```bash
# Just push changes
git add .
git commit -m "feat: new feature"
git push origin main

# Amplify automatically:
# 1. Detects push
# 2. Runs build
# 3. Runs tests (if configured)
# 4. Deploys new version
# 5. ~5 minutes total
```

### Manual Updates

Via Amplify Console:
1. Go to your app
2. Click branch (e.g., main)
3. Click **"Redeploy this version"**

---

## 🎯 Quick Start Command

### One-Line Deploy Setup

```bash
# Install Amplify CLI and deploy
npm install -g @aws-amplify/cli && \
cd /Users/oss/Desktop/missouri-crossroads/Missouri-Crossroads && \
amplify init && \
amplify add hosting && \
amplify publish
```

---

## 📞 Support Resources

### AWS Amplify Documentation
- [Amplify Hosting Guide](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [Next.js on Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/server-side-rendering-amplify.html)
- [Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)

### Troubleshooting
- [Common Build Errors](https://docs.aws.amazon.com/amplify/latest/userguide/troubleshooting.html)
- [AWS Support](https://console.aws.amazon.com/support/)

---

## 🎉 You're Ready to Deploy!

**Recommended approach:**
1. Use **Method 1** (Amplify Console) - Easiest and most reliable
2. Connect your GitHub repository
3. Add environment variables
4. Click deploy!

**Your app will be live at:** `https://xxxxx.amplifyapp.com`

Good luck! 🚀

