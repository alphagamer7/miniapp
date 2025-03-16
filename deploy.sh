#!/bin/bash

# Script to help with deploying to different environments
# Usage: ./deploy.sh [dev|prod]

# Exit on any error
set -e

# Default to development environment
ENV=${1:-dev}

echo "🚀 Starting deployment for $ENV environment..."

if [ "$ENV" = "dev" ]; then
  echo "📦 Building for development environment..."
  VITE_ENV=development npm run build -- --base=/miniapp/
  
  echo "🚢 Deploying to development repository..."
  npx gh-pages -d dist -r git@github.com:alphagamer7/miniapp.git -b gh-pages
  
  echo "✅ Deployed to https://alphagamer7.github.io/miniapp/"
elif [ "$ENV" = "prod" ]; then
  echo "📦 Building for production environment..."
  VITE_ENV=production npm run build -- --base=/battle_royale_client/
  
  echo "🚢 Deploying to production repository..."
  npx gh-pages -d dist -r git@github.com:settld-lab/battle_royale_client.git -b gh-pages
  
  echo "✅ Deployed to https://settld-lab.github.io/battle_royale_client/"
else
  echo "❌ Error: Unknown environment '$ENV'. Use 'dev' or 'prod'."
  exit 1
fi 