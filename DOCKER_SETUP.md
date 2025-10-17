# Docker Setup for Missouri Crossroads

This Docker setup allows you to share the application with others while keeping your credentials secure.

---

## 🔒 How It Works

1. **Docker image:** Contains the app code but NO secrets
2. **Environment variables:** Loaded at runtime from user's own `.env.local`
3. **Sharing:** Share the Docker image, others use their own credentials

---

## 🚀 Quick Start (For Recipients)

### 1. Get the Docker Image

**Option A: Pull from registry (if published):**
```bash
docker pull your-registry/missouri-crossroads:latest
```

**Option B: Build from source:**
```bash
git clone https://github.com/yashcoded/Missouri-Crossroads.git
cd Missouri-Crossroads
```

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .env.docker.example .env.local

# Edit with your credentials
nano .env.local  # or use any text editor
```

Fill in your own:
- AWS credentials
- Cognito details
- Google Maps API keys

### 3. Run with Docker Compose

```bash
docker-compose up -d
```

Access at: http://localhost:3000

---

## 📦 For You (Image Creator)

### Build and Share the Image

#### Option 1: Share via Docker Hub

```bash
# Build the image
docker build -t missouri-crossroads:latest .

# Tag for Docker Hub
docker tag missouri-crossroads:latest your-username/missouri-crossroads:latest

# Push to Docker Hub
docker login
docker push your-username/missouri-crossroads:latest

# Share with others:
# "Run: docker pull your-username/missouri-crossroads:latest"
```

#### Option 2: Share via File

```bash
# Build the image
docker build -t missouri-crossroads:latest .

# Save to tar file
docker save missouri-crossroads:latest > missouri-crossroads-docker.tar

# Compress
gzip missouri-crossroads-docker.tar

# Share the file: missouri-crossroads-docker.tar.gz
```

**Recipient loads it:**
```bash
docker load < missouri-crossroads-docker.tar.gz
```

#### Option 3: Share via AWS ECR (Private Registry)

```bash
# Create ECR repository
aws ecr create-repository --repository-name missouri-crossroads --region us-east-2

# Get login token
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com

# Build and tag
docker build -t missouri-crossroads:latest .
docker tag missouri-crossroads:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/missouri-crossroads:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/missouri-crossroads:latest

# Share ECR access with specific AWS users (they use their own credentials in .env.local)
```

---

## 🛡️ Security Features

### What's Protected:

✅ **Your secrets are NEVER in the image:**
- No AWS credentials baked in
- No API keys in image layers
- No .env files in image

✅ **Recipients use their own credentials:**
- They create their own `.env.local`
- They use their own AWS account
- They use their own Google Maps keys

✅ **Image can be public:**
- Safe to share on Docker Hub
- Safe to share via file
- Only contains code, not secrets

### What's Shared:

- ✅ Application code
- ✅ Dependencies (node_modules)
- ✅ Build configuration
- ✅ `.env.docker.example` (template only!)

---

## 🎯 Commands Cheat Sheet

### For You (Sharing the Image):

```bash
# Build image
docker build -t missouri-crossroads:latest .

# Test locally with your credentials
docker-compose up

# Save to file for sharing
docker save missouri-crossroads:latest | gzip > missouri-crossroads.tar.gz

# Or push to Docker Hub
docker login
docker tag missouri-crossroads:latest yourusername/missouri-crossroads:latest
docker push yourusername/missouri-crossroads:latest
```

### For Recipients:

```bash
# Option 1: From Docker Hub
docker pull yourusername/missouri-crossroads:latest

# Option 2: From file
docker load < missouri-crossroads.tar.gz

# Configure their own credentials
cp .env.docker.example .env.local
# Edit .env.local with THEIR credentials

# Run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## 🔧 Advanced: Docker Secrets (Production)

For production deployments using Docker Swarm:

```bash
# Create secrets
echo "your_aws_key" | docker secret create aws_access_key_id -
echo "your_aws_secret" | docker secret create aws_secret_access_key -
echo "your_cognito_secret" | docker secret create cognito_client_secret -

# Update docker-compose for swarm
# Use secrets instead of environment variables
```

---

## 📝 Sharing Instructions

### What to Send:

1. **The Docker image** (via Docker Hub or .tar.gz file)
2. **The `.env.docker.example` file** (template)
3. **These instructions:**

```
Hi! To run the Missouri Crossroads app:

1. Get your own AWS and Google Maps credentials
2. Copy .env.docker.example to .env.local
3. Fill in YOUR credentials in .env.local
4. Run: docker-compose up -d
5. Access: http://localhost:3000

Your credentials stay on your machine and are never shared!
```

---

## ✅ Verification

After building, verify no secrets in image:

```bash
# Inspect image layers
docker history missouri-crossroads:latest

# Check for secrets (should find NONE)
docker run --rm missouri-crossroads:latest env | grep -i "key\|secret"

# Should only show placeholder values or be empty
```

---

## 🎉 Benefits

- ✅ Share app without sharing credentials
- ✅ Others use their own AWS accounts
- ✅ No risk of credential exposure
- ✅ Easy to distribute
- ✅ Consistent environment for everyone
- ✅ Production-ready setup

