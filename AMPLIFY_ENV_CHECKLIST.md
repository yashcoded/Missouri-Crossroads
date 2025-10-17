# AWS Amplify Environment Variables Checklist

## ✅ Required Environment Variables

These MUST be set in Amplify Console → App Settings → Environment variables:

### Public Variables (Available at Build Time)
| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| `NEXT_PUBLIC_MAP_KEY` | Secret ✅ | **YES** | Google Maps API - needed at BUILD time! |
| `NEXT_PUBLIC_PLACES_KEY` | Secret ✅ | **YES** | Google Places API - needed at BUILD time! |
| `NEXT_PUBLIC_AWS_REGION` | PlainText | YES | Usually `us-east-2` |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | PlainText | YES | e.g., `us-east-2_XXXXXXXXX` |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | PlainText | YES | Cognito App Client ID |
| `NEXT_PUBLIC_DYNAMODB_USERS_TABLE` | PlainText | YES | Usually `missouri-crossroads-users` |
| `NEXT_PUBLIC_DYNAMODB_NOTES_TABLE` | PlainText | YES | Usually `missouri-crossroads-notes` |
| `NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE` | PlainText | YES | Usually `missouri-crossroads-admin-logs` |

### Server-Side Variables (Runtime Only)
| Variable | Type | Required | Notes |
|----------|------|----------|-------|
| `AWS_ACCESS_KEY_ID` | Secret ✅ | YES | Server-side only - DO NOT use NEXT_PUBLIC_ |
| `AWS_SECRET_ACCESS_KEY` | Secret ✅ | YES | Server-side only - DO NOT use NEXT_PUBLIC_ |
| `S3_BUCKET_NAME` | PlainText | YES | Usually `mr-crossroads-bucket` |
| `COGNITO_CLIENT_SECRET` | Secret ✅ | YES | Cognito App Client Secret |

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Marking as "Secret" but Not Setting as Environment Variable
**Problem:** You stored the key somewhere but didn't add it to Environment Variables

**Solution:** 
1. Go to Amplify Console
2. App Settings → Environment variables
3. Click "Manage variables"
4. Add `NEXT_PUBLIC_MAP_KEY` with your actual key
5. Check the "Secret" checkbox (optional, but recommended)
6. Click "Save"

### ❌ Mistake 2: Only Setting Server-Side Variables
**Problem:** You only set `AWS_ACCESS_KEY_ID` but forgot the public `NEXT_PUBLIC_*` variables

**Solution:** Set ALL 12 variables listed above

### ❌ Mistake 3: Using Wrong Variable Names
**Problem:** Variable name doesn't match exactly (e.g., `GOOGLE_MAPS_KEY` instead of `NEXT_PUBLIC_MAP_KEY`)

**Solution:** Use exact names from the table above

---

## 🔍 Verification Steps

### Step 1: Check Amplify Console

1. Go to AWS Amplify Console
2. Select your app
3. Go to **App Settings → Environment variables**
4. **Count:** You should see **12 variables** listed
5. **Verify names match exactly** from the table above

### Step 2: Check Build Logs

1. Go to your latest deployment
2. Click on build logs
3. Look for:
   ```
   Checking required environment variables...
   ✅ Environment variables verified
   ```
4. If you see:
   ```
   ❌ ERROR: NEXT_PUBLIC_MAP_KEY not set!
   ```
   Then the variable is missing!

### Step 3: Test Deployed App

1. Visit your Amplify URL
2. Open browser DevTools (F12)
3. Go to Console tab
4. Check for errors:
   - ✅ **Good:** Map loads, no errors
   - ❌ **Bad:** "Google Maps JavaScript API error: InvalidKeyMapError"

### Step 4: Inspect Bundle (Advanced)

1. Visit your deployed app
2. Open DevTools → Sources tab
3. Search for `googleMapsApiKey`
4. Should see actual key value, not `undefined`

---

## 🛠️ Fix Instructions

### If Map Doesn't Show:

**1. Verify Variables in Amplify:**
```bash
# You can use AWS CLI to verify
aws amplify get-app --app-id YOUR_APP_ID --region us-east-2
```

**2. Add Missing Variables:**
- Go to Amplify Console → App Settings → Environment variables
- Click "Manage variables"
- Add all 12 variables
- Mark secrets as "Secret" type ✅
- Click "Save"

**3. Redeploy:**
- Go to your branch (main)
- Click "Redeploy this version"
- Wait ~5 minutes
- Test again

---

## 📝 Quick Copy-Paste Template

Use this in Amplify Console:

```
# Public (client-side) - CAN be marked as Secret for UI hiding
NEXT_PUBLIC_MAP_KEY=AIzaSy...
NEXT_PUBLIC_PLACES_KEY=AIzaSy...
NEXT_PUBLIC_AWS_REGION=us-east-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_...
NEXT_PUBLIC_COGNITO_CLIENT_ID=...
NEXT_PUBLIC_DYNAMODB_USERS_TABLE=missouri-crossroads-users
NEXT_PUBLIC_DYNAMODB_NOTES_TABLE=missouri-crossroads-notes
NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE=missouri-crossroads-admin-logs

# Server-side (runtime) - MUST be marked as Secret
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=mr-crossroads-bucket
COGNITO_CLIENT_SECRET=...
```

---

## 🔒 Google Maps API Security

### Important: Restrict Your API Key

Even though `NEXT_PUBLIC_MAP_KEY` is public, restrict it in Google Cloud Console:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your API key
3. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add: `https://*.amplifyapp.com/*`
   - Add: `https://yourdomain.com/*` (if using custom domain)
4. Under "API restrictions":
   - Select "Restrict key"
   - Enable: Maps JavaScript API, Places API, Geocoding API
5. Click "Save"

This prevents others from using your key even though it's visible in the browser.

---

## ✅ Final Checklist

Before reporting issues:

- [ ] All 12 environment variables are set in Amplify
- [ ] Variable names match exactly (case-sensitive!)
- [ ] Google Maps keys are marked as "Secret" but ARE in Environment Variables
- [ ] Redeployed after adding variables
- [ ] Checked build logs for verification message
- [ ] Tested deployed URL (not localhost)
- [ ] Google Maps API key is restricted by domain
- [ ] No console errors in browser DevTools

---

## 🆘 Still Not Working?

Check build logs for:
```
❌ ERROR: NEXT_PUBLIC_MAP_KEY not set!
```

This means the variable isn't available during build.

**Solution:**
1. Double-check variable name: `NEXT_PUBLIC_MAP_KEY` (not `NEXT_PUBLIC_GOOGLE_MAPS_KEY`)
2. Make sure it's in "Environment variables" section
3. Redeploy

