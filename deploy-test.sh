#!/bin/bash

# Test script for GitHub Pages deployment only
# Usage: ./deploy-test.sh [prod|dev]

# Exit on errors
set -e

ENV=${1:-prod}

echo "🧪 Testing direct GitHub Pages deployment to ${ENV}..."

if [ "$ENV" = "prod" ]; then
  # Build with correct base path
  echo "🔨 Building for production..."
  npm run build -- --base=/battle_royale_client/
  
  # Deploy directly to GitHub Pages using gh-pages
  echo "🚀 Deploying directly to GitHub Pages..."
  npx gh-pages -d dist -b gh-pages -r https://github.com/settld-lab/battle_royale_client.git
  
  echo "✅ Test deployment completed. Check https://settld-lab.github.io/battle_royale_client/"
elif [ "$ENV" = "dev" ]; then
  # Build with dev base path
  echo "🔨 Building for development..."
  npm run build -- --base=/miniapp/
  
  # Deploy to dev repo
  echo "🚀 Deploying to development repository..."
  npx gh-pages -d dist -b gh-pages -r https://github.com/alphagamer7/miniapp.git
  
  echo "✅ Test deployment completed. Check https://alphagamer7.github.io/miniapp/"
else
  echo "❌ Invalid environment. Use 'prod' or 'dev'."
  exit 1
fi 