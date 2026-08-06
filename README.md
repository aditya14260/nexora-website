# Nexora Labs — Website

A 5-page site: **Home**, **Portfolio**, **AI Builder** (site type + feature cart), **Login** (Firebase), **Checkout** (50% advance payment). Pure HTML/CSS/JS — no build step, no framework required.

```
nexora-labs/
├── index.html          Home
├── portfolio.html       Portfolio / work showcase
├── builder.html          AI builder + cart (site type & features)
├── login.html            Firebase login / signup
├── checkout.html         Cart review + 50% advance payment
├── css/style.css        Design system (colors, type, components, animations)
└── js/
    ├── main.js           Nav, mobile menu, scroll reveals, cart badge
    ├── cart.js            Catalog (site types + features) + cart state (localStorage)
    ├── firebase-config.js Firebase init — PUT YOUR OWN KEYS HERE
    ├── auth.js             Login/signup logic (Firebase Auth)
    └── checkout.js         Order summary, 50% advance calc, Razorpay flow
```

## 1. Run it locally

No build tools needed. From inside the `nexora-labs` folder, just serve the files (opening `index.html` directly also works for browsing, but a local server is safer for the login/checkout pages):

```bash
# Python
python3 -m http.server 5500
# then open http://localhost:5500
```

or use the VS Code "Live Server" extension, or `npx serve`.

## 2. Connect Firebase (Auth + Database)

1. Go to the [Firebase console](https://console.firebase.google.com) → **Add project**.
2. Inside the project: **Build → Authentication → Get started** → enable **Email/Password**, and optionally **Google**.
3. **Build → Firestore Database → Create database** (start in production mode, pick a region near your users).
4. **Project settings → General → Your apps → Web app (</> icon)** → register the app → copy the `firebaseConfig` object it gives you.
5. Paste those values into `js/firebase-config.js`, replacing the placeholders:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

That's it — `login.html` and `checkout.html` already load the Firebase SDKs and this config file.

### Firestore security rules

In **Firestore → Rules**, replace the default rules with something like this so users can only manage their own data, while your orders collection stays writable for logged-in and guest checkouts (adjust to your needs):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /orders/{orderId} {
      allow create: if true;               // allow checkout, including guests
      allow read, update: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
```

Every completed or attempted checkout is written to the `orders` collection with the customer's details, chosen site type, features, computed totals, and a `status` of `pending` or `advance_paid`.

## 3. Connect a payment gateway (Razorpay) for the 50% advance

Payment gateways always require a small backend, because the **secret key** must never sit in front-end code — only the **public key** (`key_id`) can live in the browser. `js/checkout.js` already:

- Calculates the total, the **50% advance**, and the remaining balance from the cart.
- Calls `POST /api/create-order` with the advance amount to get a Razorpay `order_id`.
- Opens Razorpay's checkout for that amount, and on success writes the order to Firestore with `status: 'advance_paid'`.
- If `/api/create-order` doesn't exist yet, it tells the user clearly and saves the order as `pending` instead of failing silently.

Minimal Node/Express backend to add that route (deploy anywhere — Render, Railway, a Firebase Cloud Function, etc.):

```js
// server.js
const express = require('express');
const Razorpay = require('razorpay');
const app = express();
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,       // same public key used in checkout.js
  key_secret: process.env.RAZORPAY_KEY_SECRET // NEVER expose this in the browser
});

app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, currency } = req.body; // amount is already in paise
    const order = await razorpay.orders.create({ amount, currency, receipt: 'nexora_' + Date.now() });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Listening on :3000'));
```

Then:
1. `npm install express razorpay`
2. Get your `key_id` / `key_secret` from the [Razorpay dashboard](https://dashboard.razorpay.com/) (start in Test mode).
3. Put `key_id` in `js/checkout.js` (`RAZORPAY_KEY_ID`) and both keys as environment variables on your server.
4. Point your front-end host and backend at the same domain, or enable CORS on the backend.

Prefer Stripe or another gateway instead? The flow is identical — swap the `/api/create-order` response shape and the `Razorpay(...)` block in `js/checkout.js` for that gateway's SDK.

## 4. The "AI Builder" page

`builder.html` is a 4-step wizard (advisor → site type → features → review) backed by `js/cart.js`:

- **Catalog**: 8 site types and 14 add-on features, each with a fixed price — edit the `SITE_TYPES` and `FEATURES` arrays in `js/cart.js` to change pricing or offerings.
- **Cart**: stored in `localStorage` so it survives navigation between `builder.html` and `checkout.html` without a backend.
- **AI advisor**: a lightweight, rule-based recommender (`cart.recommend()`) that maps a free-text sentence to a suggested site type + starter features — no API key required. To make it a *real* natural-language AI, replace `recommend()` with a call to your own backend endpoint that forwards the text to the Claude API (recommended, since API keys must stay server-side), e.g.:

```js
// on your backend
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{ role: 'user', content: `Given this project description, pick one site type id from [${ids}] and up to 4 feature ids from [${featureIds}]. Reply as JSON only. Description: "${text}"` }]
  })
});
```

## 5. Colors, type & motifs

Everything is driven by CSS variables at the top of `css/style.css`:

- `--black`, `--white`, `--red`, `--blue`, `--pink` — the five requested brand colors.
- `--font-display` (Space Grotesk), `--font-body` (Inter), `--font-mono` (JetBrains Mono) — swap the Google Fonts `@import` at the top of the file to change typefaces.
- The rotating gradient **orb**, **console** typing effect, and corner-bracket **cards** are the site's signature "lab" motif — reused across all 5 pages for consistency.

## 6. Deploying

Any static host works: **Firebase Hosting** (pairs nicely since you're already using Firebase — run `firebase init hosting` then `firebase deploy`), Netlify, Vercel, or GitHub Pages. Just add your backend (`/api/create-order`) as a separate small service, or as a Firebase Cloud Function if you deploy on Firebase Hosting.
