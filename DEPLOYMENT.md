# TechVault — Deployment Guide

## Architecture
- **Backend**: Node.js + Express + MongoDB — hosted on Railway
- **Frontend**: Static HTML/CSS/JS — hosted on Netlify

---

## Step 1 — Deploy Backend to Railway

1. Create a free account at [railway.app](https://railway.app)
2. Click **New Project → Deploy from GitHub Repo** (push your code to GitHub first)
   - Or use the Railway CLI: `npm install -g @railway/cli` then `railway up`
3. In Railway, add a **MongoDB** plugin to your project (or use MongoDB Atlas free tier and paste the URI)
4. Set these **Environment Variables** in Railway dashboard:
   ```
   MONGO_URI=mongodb+srv://...your atlas or railway mongo URI...
   JWT_SECRET=techvault_super_secret_jwt_key_2025_xK9mP2qR
   ADMIN_EMAIL=admin@techvault.com
   ADMIN_PASSWORD=Admin@123456
   
   ```
5. Railway will auto-detect `package.json` and run `npm start`
6. Wait for the build to finish. Copy your live Railway URL, e.g.:
   ```
   https://techvault-backend-production.up.railway.app
   ```

---

## Step 2 — Update Frontend API URL

Open `public/js/config.js` and replace the placeholder with your actual Railway URL:

```js
// Before:
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8080/api'
  : 'https://your-backend.railway.app/api';

// After:
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8080/api'
  : 'https://techvault-backend-production.up.railway.app/api';
```

---

## Step 3 — Deploy Frontend to Netlify

**Option A — Drag and Drop (fastest):**
1. Go to [netlify.com](https://netlify.com) and log in
2. Drag the entire `public/` folder onto the Netlify drop zone
3. Your site is live instantly at e.g. `https://techvault-abc123.netlify.app`

**Option B — GitHub + Auto-deploy:**
1. Push this repo to GitHub
2. In Netlify: New Site → Import from Git → select repo
3. Set **Build command**: *(leave empty)*
4. Set **Publish directory**: `public`
5. Deploy — Netlify reads `netlify.toml` automatically

---

## Step 4 — Update CORS on Backend

Copy your Netlify domain (e.g. `https://techvault-abc123.netlify.app`) and update `server/server.js`:

```js
app.use(cors({
  origin: [
    'http://localhost:8080',
    'https://techvault-abc123.netlify.app'   // <-- your actual domain
  ]
}));
```

Commit and push to trigger a Railway redeploy.

---

## Step 5 — Seed Products (First Run)

Products auto-seed from DummyJSON on first boot if the DB is empty. You can also run manually:

```bash
npm run seed
```

---

## Admin Access

Visit `https://your-netlify-site.netlify.app/admin.html`

Login credentials (set in `.env`):
- Email: `admin@techvault.com`
- Password: `Admin@123456`

---

## Local Development

```bash
npm install
node server/server.js
# OR
npm run dev
```

Open: `http://localhost:8080`
