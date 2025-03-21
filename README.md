# Battle Royale Telegram Mini App

This is a Telegram Mini App for a Battle Royale game built with React and Vite, using Solana blockchain integration.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Setup and Installation

1. Clone the repository
   ```bash
   git clone https://github.com/settld-lab/battle_royale_client.git
   cd battle_royale_client
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

## Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

This will start a local development server, typically at `http://localhost:3000`.

### Development with SSL (for testing Telegram features locally)

The project is configured with Vite's SSL plugin. To run with HTTPS:

```bash
npm run dev -- --https
# or
yarn dev --https
```

## Building the Project

To build the project for development environment:

```bash
npm run build:dev
# or
yarn build:dev
```

To build the project for production:

```bash
npm run build:prod
# or
yarn build:prod
```

The build outputs will be generated in the `dist` directory with the appropriate base paths.

## Deployment

### Development Deployment

To deploy to the development GitHub Pages site:

```bash
# Using HTTPS
npm run deploy:dev
# or
yarn deploy:dev

# Using SSH
npm run deploy:dev:ssh
# or
yarn deploy:dev:ssh
```

This will deploy to `https://alphagamer7.github.io/miniapp/`.

### Production Deployment

To deploy to the production GitHub Pages site:

```bash
# Using HTTPS
npm run deploy:prod
# or
yarn deploy:prod

# Using SSH
npm run deploy:prod:ssh
# or
yarn deploy:prod:ssh
```

This will deploy to `https://settld-lab.github.io/battle_royale_client/`.

## Project Structure

```
battle_royale_client/
├── public/               # Static assets
├── src/                  # Source code
│   ├── components/       # React components
│   ├── pages/            # Page components
│   ├── config/           # Configuration files
│   ├── hooks/            # Custom React hooks
│   ├── provider/         # Context providers
│   ├── types/            # TypeScript type definitions
│   ├── App.jsx           # Main App component
│   └── main.jsx          # Entry point
├── .eslintrc.cjs         # ESLint configuration
├── vite.config.js        # Vite configuration
└── package.json          # Project metadata and dependencies
```

## Telegram Mini App Integration

This project is designed to run as a Telegram Mini App. Key integration points:

- Uses `@twa-dev/sdk` for Telegram Web App functionality
- Implements the BackButton component for navigation
- Supports Telegram's authentication flow



## Solana Integration

The app integrates with Solana blockchain:

- Wallet connection via Phantom and Solflare
- Transaction handling through `@solana/web3.js`
- Token management with `@solana/spl-token`

## Available Scripts

- `dev`: Start development server
- `build`: Build the project
- `build:dev`: Build with development base path
- `build:prod`: Build with production base path
- `lint`: Run ESLint checks
- `lint:fix`: Run ESLint and fix issues
- `preview`: Preview the build locally
- `deploy`: Deploy to GitHub Pages (default)
- `deploy:dev`: Deploy to development GitHub Pages
- `deploy:prod`: Deploy to production GitHub Pages
- `deploy:ssh`, `deploy:dev:ssh`, `deploy:prod:ssh`: SSH variants of deploy commands

