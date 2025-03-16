# Telegram Mini Apps React Template

> [!WARNING]
> This template is archived and is more likely to be out of date.

This template demonstrates how developers can implement a single-page application on the Telegram
Mini Apps platform using the following technologies and libraries:

- [React](https://react.dev/)
- [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [TON Connect](https://docs.ton.org/develop/dapps/ton-connect/overview)
- [Telegram SDK](https://core.telegram.org/bots/webapps#initializing-mini-apps)
- [Telegram UI](https://github.com/Telegram-Mini-Apps/TelegramUI)
- [Vite](https://vitejs.dev/)

> The template was created using [npm](https://www.npmjs.com/). Therefore, it is required to use
> it for this project as well. Using other package managers, you will receive a corresponding error.

## Install Dependencies

If you have just cloned this template, you should install the project dependencies using the
command:

```Bash
npm install
```

## Scripts

This project contains the following scripts:

- `dev`. Runs the application in development mode.
- `build`. Builds the application for production.
- `lint`. Runs [eslint](https://eslint.org/) to ensure the code quality meets the required
  standards.
- `deploy`. Deploys the application to GitHub Pages.

To run a script, use the `npm run` command:

```Bash
npm run {script}
# Example: npm run build
```

## Deployment to Development and Production

This project is configured to support both development and production environments. The primary differences between these environments include the base paths and deployment repositories:

### Deployment Environments

- **Development Environment**:
  - Base Path: `/miniapp/`
  - Deployed to: `https://alphagamer7.github.io/miniapp/`
  - Repository: `git@github.com:alphagamer7/miniapp.git`

- **Production Environment**:
  - Base Path: `/battle_royale_client/`
  - Deployed to: `https://settld-lab.github.io/battle_royale_client/`
  - Repository: `git@github.com:settld-lab/battle_royale_client.git`

### Manual Deployment Instructions

A convenient deployment script is included that handles building with the correct configuration and deploying to the appropriate repository:

#### Deploy to Development Environment

```bash
# Deploy to development
./deploy.sh dev
```

This command will:
1. Build the app with the correct development base path (`/miniapp/`)
2. Deploy the built files to the development repository
3. Make the app available at `https://alphagamer7.github.io/miniapp/`

#### Deploy to Production Environment

```bash
# Deploy to production
./deploy.sh prod
```

This command will:
1. Build the app with the correct production base path (`/battle_royale_client/`)
2. Verify that the asset paths in the built files are correct
3. Deploy the built files to the production repository
4. Make the app available at `https://settld-lab.github.io/battle_royale_client/`

### Automated CI/CD Pipeline

This project also includes a GitHub Actions workflow for automated deployments:

- The workflow is defined in `.github/workflows/github-pages-deploy.yml`
- It automatically deploys:
  - To development environment when changes are pushed to the `development` branch
  - To production environment when changes are pushed to the `master` branch
- You can also manually trigger a deployment from the GitHub Actions tab by selecting the desired environment

#### CI/CD Setup Requirements

To set up the CI/CD pipeline, you'll need to configure the following secrets in your GitHub repository:

1. `DEPLOY_KEY`: SSH key with write access to the development repository (`alphagamer7/miniapp`)
2. `PRODUCTION_DEPLOY_KEY`: SSH key with write access to the production repository (`settld-lab/battle_royale_client`)

To generate and set up these keys:

```bash
# Generate deploy key for development repository
ssh-keygen -t rsa -b 4096 -C "github-actions-dev" -f deploy_key_dev -N ""

# Generate deploy key for production repository
ssh-keygen -t rsa -b 4096 -C "github-actions-prod" -f deploy_key_prod -N ""

# Add the public keys to the respective repositories as deploy keys with write access
# Add the private keys to your GitHub repository secrets
```