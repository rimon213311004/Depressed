# 🚀 Deploying Depressd

Your app has **two parts** that deploy separately:
- **Frontend (React)** → **Vercel**
- **Backend (Express + Socket.io)** → **Render** (Vercel can't host Socket.io — it needs a always-on server)

Deploy the **backend first**, then the frontend (the frontend needs the backend URL).

---

## 🔐 Before you start: rotate your secrets
Because credentials were shared during development, rotate them now:
1. **MongoDB Atlas** → Database Access → edit user → new password → update `MONGO_URI`
2. **Cloudinary** → Settings → Security → regenerate API secret
3. **Vercel token** you pasted → Vercel → Settings → Tokens → delete it

---

## 1️⃣ Backend → Render

1. Go to **https://render.com** → sign up with GitHub.
2. **New +** → **Web Service** → connect your repo `rimon213311004/Depressed`.
3. Render reads `render.yaml` automatically. Confirm:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Under **Environment**, add these variables (from `server/.env.example`):
   - `MONGO_URI`
   - `JWT_SECRET`  (any long random string)
   - `JWT_EXPIRES` = `7d`
   - `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `CLIENT_URL` = *(leave blank for now — fill after step 2)*
5. **Create Web Service**. Wait for "Live". Copy the URL, e.g.
   `https://depressd-server.onrender.com`

> ⚠️ **MongoDB Atlas:** Network Access → add IP `0.0.0.0/0` (allow all) so Render can connect.

> ⏳ **Free tier sleeps** after 15 min idle; first request then takes ~50s to wake. Normal for free.

---

## 2️⃣ Frontend → Vercel

1. Go to **https://vercel.com** → sign up with GitHub.
2. **Add New… → Project** → import `rimon213311004/Depressed`.
3. Vercel reads `vercel.json` automatically (build from `client/`).
4. Add **Environment Variable**:
   - `VITE_API_URL` = your Render URL from step 1 (e.g. `https://depressd-server.onrender.com`) — **no trailing slash**
5. **Deploy**. Copy your live URL, e.g. `https://depressd.vercel.app`

---

## 3️⃣ Connect the two

1. Back in **Render** → your service → **Environment** →
   set `CLIENT_URL` = your Vercel URL (`https://depressd.vercel.app`)
2. Save → Render redeploys automatically.

Done! Open your Vercel URL and sign up. 🎉

---

## 🔁 Future updates
Just `git push` to `main` — **both** Vercel and Render auto-redeploy.

## 🧪 Troubleshooting
| Symptom | Fix |
|---|---|
| Login/chat fails, CORS error in console | `CLIENT_URL` on Render must exactly match your Vercel URL |
| Requests go to localhost | `VITE_API_URL` not set on Vercel — add it, then redeploy |
| First load very slow | Render free tier waking up (~50s), then fast |
| Can't connect to DB | Atlas Network Access missing `0.0.0.0/0` |
