# TMAX Restaurant — Fresh Website

A new restaurant website project, separate from the existing `Baffarh/Restaurant` repository. This project includes a responsive menu, category filters, cart quantity controls, checkout form, WhatsApp ordering, and a Paystack payment integration starter.

## Important: online payments require a server
GitHub Pages only hosts static files. It cannot run `server.js` or safely store a Paystack secret key. Deploy this app to a Node.js host (for example Render, Railway, or another trusted Node host) for checkout to work. Do not publish the Paystack secret key or put it in `public/app.js`.

## Run locally
1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Run `npm install`.
4. Add a Paystack **test** secret key to `.env` as `PAYSTACK_SECRET_KEY=sk_test_...`.
5. Set `BASE_URL=http://localhost:3000`.
6. Run `npm start` and open `http://localhost:3000`.

The Paystack flow uses server-side initialization and server-side verification. The browser is redirected to Paystack-hosted checkout; this website never asks users to type card details into its own form. Test payments before switching to live keys.

## Before launch
- Update the sample restaurant address, phone, hours, and delivery areas in `public/index.html`.
- Update the WhatsApp number in `public/app.js`.
- Adjust menu items and prices in `public/app.js` AND the price catalogue in `server.js` so both match.
- Replace demo images if needed.
- Add a database/order management system, order persistence, staff notifications, and a signed Paystack webhook before taking real orders at scale. This starter verifies return status but does not persist orders or guarantee fulfilment on its own.
- Add privacy, refund, delivery, and terms pages appropriate for the actual business.
- Keep `.env` out of GitHub. `.gitignore` already excludes it.

## Create a new GitHub repository without touching the old one
1. Sign in at https://github.com/new
2. Repository name: `tmax-restaurant-online` (or another available name).
3. Choose Public if you want the code to be public; a public repository is not required for a deployed website, but it can be easier for setup.
4. Do not tick “Add a README” because this project already has one (or upload files in a way that merges safely).
5. Create repository and upload all files/folders from this project. Include `public/`, `server.js`, `package.json`, `.env.example`, `.gitignore`, and `README.md`. Never upload `.env` or real secret keys.

## Deployment
Deploy this repository as a **Node web service** on a host that supports Node.js, not GitHub Pages. Use:
- Build command: `npm install`
- Start command: `npm start`
- Environment variable `PAYSTACK_SECRET_KEY`: begin with the Paystack test secret key.
- Environment variable `BASE_URL`: your deployed HTTPS app URL.
- Environment variable `WHATSAPP_NUMBER`: the restaurant's WhatsApp number in international digits-only format.

Configure the Paystack dashboard callback URL to your deployed `/payment-result.html` if required by your account setup. Test the complete payment journey before enabling live payments.

## Current limitations
This is a starter, not yet a production-complete restaurant management system. It does not store orders in a database, provide an admin dashboard, automatically dispatch delivery, or include a verified payment webhook. Implement these before relying on it for high-volume real-world operations.
