# AWS Amplify Setup - Step by Step

Since you've already added the repo to Amplify, follow these exact steps:

---

## 🎯 Step 1: Configure Main Branch as Production

### In AWS Amplify Console:

1. **Navigate to your app**
   - Go to: https://console.aws.amazon.com/amplify/
   - Click on "Missouri-Crossroads" (or your app name)

2. **Set main branch**
   - Go to **"App settings"** → **"General"**
   - Or click on **"Hosting environments"** tab
   - Look for branch settings

3. **Connect main branch (if not already):**
   - Click **"Connect branch"**
   - Select **"main"**
   - Click **"Next"**
   - Review build settings
   - Click **"Save and deploy"**

4. **Set as production:**
   - Main branch should automatically be marked as production
   - Look for "Production" badge next to branch name

---

## 🔍 Step 2: Enable Pull Request Previews

### In AWS Amplify Console:

1. **Go to App Settings → Previews**
   
2. **Enable PR previews:**
   - Toggle **"Enable pull request previews"** to ON
   
3. **Configure PR settings:**
   - Select **"Automatically deploy pull requests"**
   - Choose which branches: Select **"All branches"** or specific ones
   - Check **"Enable preview for pull requests from forked repositories"** (if needed)

4. **Click "Save"**

### Now every PR will:
- ✅ Automatically build
- ✅ Get a unique preview URL
- ✅ Show build status in PR
- ✅ Auto-deploy on PR updates

**PR Preview URL format:**
```
https://pr-123.xxxxx.amplifyapp.com
```

---

## 🔐 Step 3: Add Environment Variables

### In AWS Amplify Console:

1. **Go to App Settings → Environment variables**

2. **Click "Manage variables"**

3. **Add these variables one by one:**

#### Public Variables (Type: PlainText)
| Variable Name | Example Value | Type |
|--------------|---------------|------|
| `NEXT_PUBLIC_AWS_REGION` | `us-east-2` | PlainText |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `us-east-2_xxxxxxxxx` | PlainText |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `xxxxxxxxxxxx` | PlainText |
| `NEXT_PUBLIC_DYNAMODB_USERS_TABLE` | `missouri-crossroads-users` | PlainText |
| `NEXT_PUBLIC_DYNAMODB_NOTES_TABLE` | `missouri-crossroads-notes` | PlainText |
| `NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE` | `missouri-crossroads-admin-logs` | PlainText |

#### Secret Variables (Type: Secret - CHECK THE SECRET BOX!)
| Variable Name | Your Value | Type |
|--------------|------------|------|
| `AWS_ACCESS_KEY_ID` | AKIA... | **Secret** ✅ |
| `AWS_SECRET_ACCESS_KEY` | your_secret_key | **Secret** ✅ |
| `S3_BUCKET_NAME` | `mr-crossroads-bucket` | PlainText |
| `COGNITO_CLIENT_SECRET` | your_secret | **Secret** ✅ |
| `NEXT_PUBLIC_MAP_KEY` | AIza... | **Secret** ✅ |
| `NEXT_PUBLIC_PLACES_KEY` | AIza... | **Secret** ✅ |

4. **Click "Save"**

5. **Redeploy:**
   - After saving variables, click **"Redeploy this version"**
   - Or push a new commit to trigger build

---

## ⚙️ Step 4: Verify Build Settings

### In AWS Amplify Console:

1. **Go to App Settings → Build settings**

2. **Verify these settings:**

**Build specification should look like this:**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm@10
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

3. **If it doesn't match:**
   - Click **"Edit"**
   - Replace with the above
   - Or upload the `amplify.yml` file from your repo
   - Click **"Save"**

---

## 🚀 Step 5: Deploy!

### Option A: Trigger Manual Deploy

1. **Go to your app in Amplify Console**
2. **Click on "main" branch**
3. **Click "Redeploy this version"**
4. **Monitor the build** (takes ~5-10 minutes)

### Option B: Push to Trigger Auto-Deploy

```bash
cd /Users/oss/Desktop/missouri-crossroads/Missouri-Crossroads

# Make a small change or just push
git commit --allow-empty -m "trigger amplify deployment"
git push origin main
```

Amplify will automatically:
1. Detect the push
2. Start building
3. Run tests (if configured)
4. Deploy to production

---

## 📍 Step 6: Configure Custom Domain (Optional)

### In AWS Amplify Console:

1. **Go to App Settings → Domain management**
2. **Click "Add domain"**
3. **Enter your domain** (if you have one)
4. **Follow DNS configuration**
5. **Wait for SSL certificate** (~15 minutes)

### Or Use Amplify Provided Domain:

Your app will be available at:
```
https://main.xxxxx.amplifyapp.com
```

You can find the exact URL in the Amplify Console under your app.

---

## ✅ Verification Checklist

After deployment, verify:

### In Amplify Console:
- [ ] Main branch shows "Deployed" status
- [ ] Build logs show success
- [ ] No errors in deployment
- [ ] Environment variables all set (check count)
- [ ] PR previews enabled

### Test Your Live App:
- [ ] Visit your Amplify URL
- [ ] Map page loads
- [ ] See 700+ pins on map (not just 91!)
- [ ] Can search locations
- [ ] Category filters work
- [ ] No console errors in browser
- [ ] Authentication works
- [ ] API routes respond

### Create Test PR:
- [ ] Create a test PR
- [ ] Verify it gets a preview URL
- [ ] Preview deploys successfully
- [ ] Preview URL works

---

## 🔧 Quick Setup Commands

### Update Your Local Repo with Deployment Files:

```bash
cd /Users/oss/Desktop/missouri-crossroads/Missouri-Crossroads

# Add new deployment files
git add amplify.yml DEPLOYMENT_AWS_AMPLIFY.md .amplify-env-template.txt

# Commit
git commit -m "docs: add AWS Amplify deployment configuration and guide"

# Push to trigger first deployment
git push origin main
```

---

## 📊 What to Expect

### First Deployment:
- **Time:** 5-10 minutes
- **Steps:** Provision → Build → Deploy → Verify
- **Result:** Live URL like `https://main.d123456.amplifyapp.com`

### Subsequent Deployments:
- **Time:** 3-5 minutes (cached)
- **Trigger:** Any push to `main`
- **Auto:** Runs tests → Builds → Deploys

### PR Previews:
- **Time:** 3-5 minutes per PR
- **URL:** `https://pr-123.d123456.amplifyapp.com`
- **Auto:** Updates on each PR commit

---

## 🎉 You're All Set!

**Next steps:**
1. Copy environment variables from `.amplify-env-template.txt`
2. Add them to Amplify Console
3. Click "Redeploy" or push to `main`
4. Wait ~5-10 minutes
5. Your app is live! 🚀

Need help with any specific step? Let me know!

