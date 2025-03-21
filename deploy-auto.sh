#!/bin/bash

# Script to automatically deploy to the development environment
# Usage: ./deploy-auto.sh [--ssh]

# Exit on any error
set -e

# Check if --ssh flag is provided
USE_SSH=false
if [[ "$1" == "--ssh" ]]; then
  USE_SSH=true
fi

echo "🚀 Starting deployment to development environment..."

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ You must be on the main branch to deploy. Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Always deploy to development
echo "🔔 Deploying to DEVELOPMENT environment"
if [ "$USE_SSH" = true ]; then
  ./deploy.sh dev --ssh
else
  ./deploy.sh dev
fi 