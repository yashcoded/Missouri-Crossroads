#!/bin/bash

# Missouri Crossroads - Docker Build Script
# This script builds a Docker image without including any secrets

set -e

echo "🐳 Building Missouri Crossroads Docker Image..."
echo ""

# Check if .env.local exists (for build-time public vars)
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found!"
    echo "Creating from example..."
    cp .env.docker.example .env.local
    echo "❌ ERROR: Please edit .env.local with your actual values, then run this script again."
    exit 1
fi

# Load public environment variables for build
set -a
source .env.local
set +a

echo "✅ Environment variables loaded (public ones will be in build)"
echo ""

# Build the Docker image
echo "🔨 Building Docker image..."
docker build \
  --build-arg NEXT_PUBLIC_AWS_REGION="$NEXT_PUBLIC_AWS_REGION" \
  --build-arg NEXT_PUBLIC_COGNITO_USER_POOL_ID="$NEXT_PUBLIC_COGNITO_USER_POOL_ID" \
  --build-arg NEXT_PUBLIC_COGNITO_CLIENT_ID="$NEXT_PUBLIC_COGNITO_CLIENT_ID" \
  --build-arg NEXT_PUBLIC_DYNAMODB_USERS_TABLE="$NEXT_PUBLIC_DYNAMODB_USERS_TABLE" \
  --build-arg NEXT_PUBLIC_DYNAMODB_NOTES_TABLE="$NEXT_PUBLIC_DYNAMODB_NOTES_TABLE" \
  --build-arg NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE="$NEXT_PUBLIC_DYNAMODB_ADMIN_LOGS_TABLE" \
  --build-arg NEXT_PUBLIC_MAP_KEY="$NEXT_PUBLIC_MAP_KEY" \
  --build-arg NEXT_PUBLIC_PLACES_KEY="$NEXT_PUBLIC_PLACES_KEY" \
  -t missouri-crossroads:latest \
  .

echo ""
echo "✅ Docker image built successfully!"
echo ""
echo "📦 To run the container:"
echo "   docker-compose up -d"
echo ""
echo "📤 To share the image:"
echo "   Option 1 (Docker Hub):"
echo "     docker tag missouri-crossroads:latest yourusername/missouri-crossroads:latest"
echo "     docker push yourusername/missouri-crossroads:latest"
echo ""
echo "   Option 2 (File):"
echo "     docker save missouri-crossroads:latest | gzip > missouri-crossroads.tar.gz"
echo ""
echo "🔒 Security: Secrets are NOT in the image!"
echo "   Recipients will need to provide their own .env.local file"
echo ""

