# Deployment Guide (cPanel + Render, No Netlify)

## Architecture

- Frontend: `https://finpay.com.ng` and `https://www.finpay.com.ng` (served from cPanel `/public_html`)
- Backend API: `https://api.finpay.com.ng` (served by Render web service)

Do not point `finpay.com.ng` to Render if cPanel is hosting the website.

## 1) Configure Render backend

In Render service settings, set:

- `NODE_ENV=production`
- `PORT=10000` (or leave Render default)
- `MONGODB_URI=<your production mongodb uri>`
- `REDIS_URL=<your production redis url>`
- `JWT_SECRET=<long random secret>`
- `ENCRYPTION_KEY=<32+ character secret>`
- `CLIENT_URL=https://finpay.com.ng,https://www.finpay.com.ng`
- `STRIPE_SECRET_KEY=<live or test key>`
- `STRIPE_WEBHOOK_SECRET=<stripe webhook secret>`
- SMTP (cPanel mailbox):
  - `SMTP_HOST=mail.finpay.com.ng`
  - `SMTP_PORT=465`
  - `SMTP_SECURE=true`
  - `SMTP_USER=support@finpay.com.ng`
  - `SMTP_PASS=<mailbox password>`
  - `SMTP_FROM=FinPay Support <support@finpay.com.ng>`

Optional fallback:

- `RESEND_API_KEY=<optional>`
- `RESEND_FROM=FinPay Support <support@finpay.com.ng>`
- `SALES_INBOX=sales@finpay.com.ng`

Contact-sales CRM routing (optional, choose one or more):

- Generic CRM webhook:
  - `CRM_WEBHOOK_URL=<https endpoint>`
  - `CRM_WEBHOOK_AUTH_HEADER=Authorization`
  - `CRM_WEBHOOK_AUTH_TOKEN=<token or bearer token>`
  - `CRM_WEBHOOK_SECRET=<hmac signing secret>`
  - `CRM_LEAD_SOURCE_LABEL=FinPay Contact Sales Form`
- HubSpot Forms:
  - `HUBSPOT_PORTAL_ID=<portal id>`
  - `HUBSPOT_FORM_ID=<form id>`
  - `HUBSPOT_PRIVATE_APP_TOKEN=<optional private app token>`
  - `HUBSPOT_FIELD_MONTHLY_VOLUME=monthly_volume`
  - `HUBSPOT_FIELD_PREFERRED_CONTACT=preferred_contact`
  - `HUBSPOT_FIELD_LEAD_SOURCE=lead_source`
- Salesforce Lead webhook:
  - `SALESFORCE_LEAD_WEBHOOK_URL=<flow/apex rest endpoint>`
  - `SALESFORCE_API_TOKEN=<optional bearer token>`
  - `SALESFORCE_FIELD_MONTHLY_VOLUME=Monthly_Volume__c`
  - `SALESFORCE_FIELD_PREFERRED_CONTACT=Preferred_Contact__c`

## 2) Configure Render custom domain

In Render custom domains for the API service:

- Keep only `api.finpay.com.ng`
- Remove `finpay.com.ng` and `www.finpay.com.ng` from Render

## 3) Configure DNS at your registrar/cPanel

Use your registrar DNS (not Netlify DNS):

- `A` record: `@` -> your cPanel server IP
- `CNAME` record: `www` -> `@` (or `finpay.com.ng`)
- `CNAME` record: `api` -> `fintech-payment-gateway.onrender.com`

Important:

- Delete conflicting `A`/`AAAA` records for `api`.
- Wait for DNS propagation, then click refresh/verify in Render.

## 4) Build frontend for production

In `client/.env` set:

- `VITE_API_URL=https://api.finpay.com.ng/api`
- `VITE_WALLETCONNECT_PROJECT_ID=<your walletconnect project id>`

Build:

```bash
cd client
npm ci
npm run build
```

## 5) Upload frontend to cPanel

- Open cPanel File Manager
- Go to `/public_html`
- Remove old files if needed
- Upload everything inside `client/dist/` to `/public_html`
- Enable Force HTTPS redirect in cPanel Domains

## 6) Configure Stripe webhook

Set Stripe webhook endpoint to:

- `https://api.finpay.com.ng/webhooks/stripe`

Use that webhook signing secret as `STRIPE_WEBHOOK_SECRET` in Render.

## 7) Validate end-to-end

- Open `https://finpay.com.ng`
- Check `https://api.finpay.com.ng/health` returns status JSON
- Register a user and verify OTP email is delivered
- Login and call authenticated endpoints
- Ensure CORS errors are gone in browser console
- Submit `/contact-sales` form and verify lead appears in your configured CRM destination(s)

## 8) Data storage and retrieval

- User/account records are stored in MongoDB collection `users`.
- OTP verification metadata is stored per user in `users`.
- Payment records are stored in MongoDB collection `transactions`.
- Payment methods are stored in MongoDB collection `paymentmethods`.

## Important production checklist

- Set live values for `KYC_API_URL` and `KYC_API_KEY` in Render.
- Set `SWAP_PROVIDER_BASE_URL` and optional `SWAP_PROVIDER_API_KEY`.
- Keep `VITE_WALLETCONNECT_PROJECT_ID` configured in `client/.env`.
- Confirm SMTP mailbox credentials point to your production support mailbox.
