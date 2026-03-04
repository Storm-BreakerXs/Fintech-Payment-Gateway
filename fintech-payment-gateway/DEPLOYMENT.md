# Deployment Guide

## 1) Prepare production env vars

Create `.env` in project root from `.env.example` and set real values:

- `MONGODB_URI` (production MongoDB)
- `REDIS_URL` (production Redis)
- `JWT_SECRET` (long random secret)
- `ENCRYPTION_KEY` (32+ chars)
- `CLIENT_URL` (your frontend domain)
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (live keys)
- Email OTP provider:
  - Primary: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - Fallback (recommended): `RESEND_API_KEY`, `RESEND_FROM`
  - `OTP_RESEND_COOLDOWN_SECONDS` (recommended: `60`)

Create `client/.env` from `client/.env.example`:

- `VITE_API_URL=https://your-api-domain/api`

## 2) Build and run with Docker

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Services:

- Frontend: `http://<host>:80`
- API: `http://<host>:3001`
- MongoDB: `27017`
- Redis: `6379`

## 3) Configure HTTPS for live traffic

`docker-compose.prod.yml` does not terminate TLS directly.
Put a managed load balancer, Caddy, Traefik, or Nginx in front and route:

- `https://your-domain` -> client `:80`
- `https://api.your-domain` -> server `:3001`

## 4) Configure Stripe webhook

Set Stripe webhook endpoint to:

- `https://api.your-domain/webhooks/stripe`

Use the webhook signing secret from Stripe dashboard as `STRIPE_WEBHOOK_SECRET`.

## 5) Validate after deploy

- `GET /health` returns `{"status":"ok"...}`
- Register/login works
- New user registration sends OTP to the email entered by that user
- Payment route errors clearly if Stripe is not configured
- CORS allows only your `CLIENT_URL`

## 6) Data storage and retrieval

- User/account records are stored in MongoDB collection `users`.
- OTP verification metadata (hashed OTP, expiry, resend cooldown timestamp) is stored per user in `users`.
- Payment records are stored in MongoDB collection `transactions`.
- Payment methods are stored in MongoDB collection `paymentmethods`.
- Frontend dashboard and history load from:
  - `GET /api/payments/history`
- Account settings load/save from:
  - `GET /api/users/me`
  - `PATCH /api/users/me`

## Important production gaps

- `server/src/routes/auth.ts` still has mock KYC verification.
- `server/src/routes/crypto.ts` still has mock swap quote logic.
- `client/src/hooks/useWeb3.ts` has WalletConnect/Coinbase placeholders.
