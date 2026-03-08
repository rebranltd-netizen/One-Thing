# Deploying "One Thing" to Your Phone
### Your personal execution assistant — pinned to your home screen in ~20 minutes

---

## What You'll Need
- A free GitHub account (github.com)
- A free Vercel account (vercel.com)
- A free Anthropic account (console.anthropic.com)
- The project files (the `execution-assistant` folder)

---

## Step 1 — Get Your Anthropic API Key (5 mins)

1. Go to **console.anthropic.com**
2. Sign up with your email (free)
3. Click **"API Keys"** in the left sidebar
4. Click **"Create Key"** → give it a name like "one-thing-app"
5. **Copy the key** — it starts with `sk-ant-api03-...`
6. Save it somewhere safe (Notes app) — you only see it once

> 💡 Cost: Roughly $0.01–0.05 NZD per day of normal use. You get $5 free credit to start.

---

## Step 2 — Put the Files on GitHub (5 mins)

1. Go to **github.com** and sign in (or create a free account)
2. Click the **"+"** in the top right → **"New repository"**
3. Name it `one-thing` → click **"Create repository"**
4. On the next screen, click **"uploading an existing file"**
5. Upload the entire `execution-assistant` folder contents:
   - Drag in: `package.json`
   - Drag in the `public/` folder (index.html inside)
   - Drag in the `src/` folder (App.js and index.js inside)
6. Click **"Commit changes"**

---

## Step 3 — Deploy on Vercel (5 mins)

1. Go to **vercel.com** → sign up with your GitHub account
2. Click **"Add New Project"**
3. Find your `one-thing` repository → click **"Import"**
4. Vercel will auto-detect it as a React app
5. Click **"Deploy"** — takes about 2 minutes
6. You'll get a URL like: `one-thing-abc123.vercel.app`

That's your app — live on the internet, just for you.

---

## Step 4 — Pin It to Your Phone Home Screen

### On iPhone:
1. Open Safari (must be Safari, not Chrome)
2. Go to your Vercel URL
3. Tap the **Share button** (box with arrow pointing up)
4. Scroll down → tap **"Add to Home Screen"**
5. Name it **"One Thing"** → tap **"Add"**

### On Android:
1. Open Chrome
2. Go to your Vercel URL
3. Tap the **three dots** menu (top right)
4. Tap **"Add to Home screen"**
5. Name it **"One Thing"** → tap **"Add"**

It will appear on your home screen like a real app. Tap it and it opens full screen, no browser bar.

---

## Step 5 — First Time Setup in the App

1. Open the app from your home screen
2. It will ask for your Anthropic API key
3. Paste the key you saved in Step 1
4. Tap **"Save & Start"**

Your key is stored **only on your device** — never sent anywhere except directly to Anthropic when you send a message.

---

## What Persists Between Sessions

✅ Your entire chat history  
✅ All captured tasks (with their categories, energy levels, urgency)  
✅ Your API key (so you only enter it once)  
✅ Checkin counts (so the app knows what you've been avoiding)  

Everything is stored in your browser's local storage on your device.

---

## Updating the App Later

When you want to make changes (new features, tweaks):
1. Edit the files
2. Upload the changed files to GitHub (same repo)
3. Vercel automatically redeploys — usually within 60 seconds
4. Refresh the app on your phone

---

## If Something Goes Wrong

**"Connection issue" error in the app:**
→ Your API key might be wrong. Tap the ✦ button (top right) to re-enter it.

**App not loading:**
→ Check Vercel dashboard — look for any build errors in the deployment log.

**Tasks not saving:**
→ Make sure you're opening the app in the same browser you set it up in.

---

## Your App Features

**Chat tab** — Talk naturally. Dump tasks, ask for recommendations, brain dump. The AI categorises everything automatically.

**Check In tab** — Quick 2-tap check-in (energy + time). Get one recommendation immediately.

**Tasks tab** — See everything organised by category. Tasks that have appeared in 3+ check-ins get a "👀 been waiting" flag. Tick them off when done — the app tells the AI you completed something.

---

*Built specifically for you. Tweak anything — the system prompt in App.js contains everything the AI knows about your life and patterns.*
