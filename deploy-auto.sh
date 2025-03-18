#!/bin/bash

# Script to automatically deploy to the appropriate environment based on Git remote
# Usage: ./deploy-auto.sh

# Exit on any error
set -e

echo "🔍 Determining deployment environment based on Git remotes..."

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ You must be on the main branch to deploy. Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Get the remote for the current branch
REMOTE=$(git config --get branch.main.remote)
REMOTE_URL=$(git remote get-url $REMOTE)

echo "Current remote: $REMOTE ($REMOTE_URL)"

# Determine environment based on remote URL
if [[ "$REMOTE_URL" == *"settld-lab/battle_royale_client"* ]]; then
  echo "🔔 Detected push to upstream (settld-lab/battle_royale_client) - deploying to PRODUCTION"
  ./deploy.sh prod
elif [[ "$REMOTE_URL" == *"alphagamer7/miniapp"* ]]; then
  echo "🔔 Detected push to origin (alphagamer7/miniapp) - deploying to DEVELOPMENT"
  ./deploy.sh dev
else
  echo "❓ Unknown remote URL: $REMOTE_URL"
  echo "Please specify environment manually:"
  echo "  - ./deploy.sh dev  (for development)"
  echo "  - ./deploy.sh prod (for production)"
  exit 1
fi 