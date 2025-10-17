# Docker Distribution - Missouri Crossroads

## 🎯 Quick Summary

This Docker setup lets you share the app **without exposing your credentials**. Recipients use their own AWS/Google API keys.

---

## 🚀 For You (Sharing the Image)

### Build the Image

```bash
# Make build script executable
chmod +x docker-build.sh

# Build image (reads public vars from .env.local)
./docker-build.sh
```

### Share the Image

**Option 1: Docker Hub (Easiest)**
```bash
docker login
docker tag missouri-crossroads:latest yourusername/missouri-crossroads:latest
docker push yourusername/missouri-crossroads:latest
```

Send to recipient:
```
docker pull yourusername/missouri-crossroads:latest
```

**Option 2: As a File**
```bash
docker save missouri-crossroads:latest | gzip > missouri-crossroads.tar.gz
```

Send file to recipient (they run):
```bash
docker load < missouri-crossroads.tar.gz
```

---

## 📥 For Recipients (Running Your Image)

### Prerequisites
- Docker and Docker Compose installed
- Own AWS account with resources set up
- Own Google Maps API keys

### Setup Steps

1. **Get the image** (via Docker Hub or file)

2. **Create environment file:**
```bash
cp .env.docker.example .env.local
```

3. **Edit `.env.local` with YOUR credentials:**
```bash
# Use your own AWS keys!
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Use your own Google Maps keys!
NEXT_PUBLIC_MAP_KEY=your_key
NEXT_PUBLIC_PLACES_KEY=your_key

# etc...
```

4. **Run:**
```bash
docker-compose up -d
```

5. **Access:**
```
http://localhost:3000
```

---

## 🔒 Security Guarantee

### What's in the Image:
- ✅ Application code
- ✅ Dependencies
- ✅ Build artifacts
- ❌ NO secrets
- ❌ NO credentials
- ❌ NO .env files

### Verification:

```bash
# Check image doesn't contain secrets
docker history missouri-crossroads:latest

# Inspect environment (should show no secrets)
docker inspect missouri-crossroads:latest | grep -i "env"

# Should be empty or show only placeholders
```

---

## 📋 Files Included

- `Dockerfile` - Multi-stage build configuration
- `docker-compose.yml` - Runtime configuration
- `.dockerignore` - Excludes secrets from image
- `.env.docker.example` - Template for credentials
- `docker-build.sh` - Build script
- `DOCKER_README.md` - This file

---

## 🎉 Benefits

✅ **Secure:** Your secrets never leave your machine  
✅ **Portable:** Works on any Docker-enabled system  
✅ **Isolated:** Each recipient uses own credentials  
✅ **Easy:** One command to run  
✅ **Consistent:** Same environment everywhere  

---

## 💡 Tips

- **Never commit** `.env.local` to git (already in .gitignore)
- **Always use** `.env.docker.example` as template for sharing
- **Recipients** must set up their own AWS resources
- **Test** the image before sharing

---

**Ready to build and share!** 🐳

