# Fintech Payment Gateway

A production-ready, fintech-grade payment gateway system with cryptocurrency integration, 3D card animations, MetaMask wallet support, and real-time price tickers.

## Features

- **3D Card Component**: Interactive credit card with CSS 3D transforms
- **Crypto Payments**: MetaMask integration with extensible wallet hooks
- **Live Price Ticker**: Real-time cryptocurrency prices
- **Multi-Chain Support**: Ethereum, Polygon, BSC, Avalanche
- **Compliance Ready**: KYC/AML integration, transaction monitoring
- **Security**: End-to-end encryption, PCI DSS compliant architecture
- **Smart Contracts**: Audited Solidity contracts for escrow and payments

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Redis
- **Blockchain**: Ethers.js + Web3.js
- **Deployment**: Docker + Docker Compose + Nginx

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MetaMask wallet

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd fintech-payment-gateway
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
cp client/.env.example client/.env
# Edit .env with your API keys
```

4. Start development server:
```bash
npm run dev
```

### Production Deployment

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Detailed checklist: see `DEPLOYMENT.md`.

## Production Readiness Notes

- Replace mock KYC flow in `server/src/routes/auth.ts` with a real provider.
- Replace mock swap quote logic in `server/src/routes/crypto.ts` with a real DEX/aggregator integration.
- Configure live Stripe keys and webhook secret before enabling card payments.

## Project Structure

```
fintech-payment-gateway/
├── client/                 # Vite React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   └── services/      # Business logic
├── contracts/             # Solidity smart contracts
└── deployment/            # Docker & Nginx configs
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email OTP
- `POST /api/auth/resend-verification` - Resend email OTP
- `POST /api/auth/verify-kyc` - KYC verification

### User
- `GET /api/users/me` - Get current user profile/preferences
- `PATCH /api/users/me` - Update current user profile/preferences

### Payments
- `POST /api/payments/fiat` - Process fiat payment
- `POST /api/payments/crypto` - Process crypto payment
- `GET /api/payments/status/:id` - Check payment status

### Crypto
- `GET /api/crypto/prices` - Get live prices
- `GET /api/crypto/quote` - Get swap quote
- `POST /api/crypto/swap` - Execute token swap

## Security

- All sensitive data encrypted at rest and in transit
- JWT authentication with refresh tokens
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers

## License

MIT License - See LICENSE file for details
