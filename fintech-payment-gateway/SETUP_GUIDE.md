# FinPay Gateway - Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- MetaMask wallet (for testing)

### 2. Installation

```bash
# Extract the zip file
cd fintech-payment-gateway

# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env
cp client/.env.example client/.env

# Edit .env with your API keys:
# - JWT_SECRET (generate a random string)
# - STRIPE_SECRET_KEY (from Stripe Dashboard)
# - INFURA_PROJECT_ID (from Infura)
# - COINMARKETCAP_API_KEY (from CoinMarketCap)
```

### 4. Development Mode

```bash
# Start both client and server
npm run dev

# Client runs on: http://localhost:5173
# Server runs on: http://localhost:3001
```

### 5. Production Deployment

```bash
# Build and deploy with Docker
docker compose -f docker-compose.prod.yml up --build -d

# Or deploy client only
npm run build
cd client && npm run build
```

## Project Structure

```
fintech-payment-gateway/
├── client/                 # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── components/    # React components (3D Card, Wallet Modal, etc.)
│   │   ├── pages/         # Page components (Home, Payment, Dashboard)
│   │   ├── hooks/         # Custom hooks (useWeb3, usePrices)
│   │   └── styles/        # Global CSS styles
│   └── public/            # Static assets
├── server/                # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── routes/        # API routes (auth, payments, crypto)
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Utilities (database, redis, encryption)
├── contracts/             # Solidity Smart Contracts
│   ├── PaymentProcessor.sol
│   └── Escrow.sol
└── deployment/            # Docker & Nginx configs
```

## Features Included

### Frontend
- **3D Credit Card** - Interactive card with CSS 3D transforms
- **MetaMask Integration** - WalletConnect/Coinbase hooks are scaffolds and need implementation
- **Live Price Ticker** - Real-time crypto prices
- **Payment Forms** - Card and crypto payment processing
- **Dashboard** - Analytics with charts and transaction history
- **Responsive Design** - Works on all devices

### Backend
- **Authentication** - JWT-based auth with KYC support
- **Payment Processing** - Stripe integration for cards
- **Crypto APIs** - Live prices from CoinGecko
- **Webhooks** - Stripe and crypto payment verification
- **Security** - Rate limiting, encryption, Helmet headers
- **Database** - MongoDB with Redis caching

### Smart Contracts
- **PaymentProcessor** - Escrow and payment handling
- **Escrow** - Dispute resolution system
- **Multi-token Support** - ETH and ERC20 tokens

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-kyc` - KYC verification

### Payments
- `POST /api/payments/card` - Process card payment
- `POST /api/payments/crypto` - Process crypto payment
- `GET /api/payments/status/:id` - Check payment status
- `GET /api/payments/history` - Get transaction history

### Crypto
- `GET /api/crypto/prices` - Get live prices
- `GET /api/crypto/history/:symbol` - Get price history
- `GET /api/crypto/quote` - Get swap quote
- `GET /api/crypto/tokens` - Get supported tokens

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| JWT_SECRET | Secret for JWT signing | Yes |
| MONGODB_URI | MongoDB connection string | Yes |
| REDIS_URL | Redis connection string | No |
| STRIPE_SECRET_KEY | Stripe API key | Yes |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | Yes |
| INFURA_PROJECT_ID | Infura project ID | Yes |
| COINMARKETCAP_API_KEY | CMC API key | No |
| ENCRYPTION_KEY | 32-char encryption key | Yes |

## Security Features

- 256-bit AES encryption for sensitive data
- JWT authentication with refresh tokens
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers
- PCI DSS compliant architecture

## License

MIT License - See LICENSE file for details
