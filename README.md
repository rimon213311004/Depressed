# Depressd 💙

A supportive **MERN** social platform where people can share, connect, and feel less alone — with real-time chat, groups, and friends.

🔗 **Live app:** https://client-ashen-pi.vercel.app
🔗 **API:** https://depressed-wqmr.onrender.com

---

## ✨ Features

- **Auth (JWT):** Signup captures name, email, occupation, age, password. Login + protected routes.
- **Feed (Facebook-style):** posts with image/video upload, caption, like ❤️, comment 💬, share ↗.
- **External share links:** attach a Facebook / Instagram / any-platform link to a post.
- **Real-time chat (Socket.io):** 1-to-1 messaging, online status 🟢, typing indicators.
- **Send images in chat:** share photos in DMs and groups (📎).
- **Group chats:** create groups, add members, group messaging, group settings (members, leave).
- **Friends system:** send / accept / reject friend requests, "people you may know" suggestions, live request badge.
- **Profile & settings:** edit name/occupation/age/bio, upload avatar (Cloudinary), add social links.
- **Day / Night mode:** persistent light & dark themes 🌙☀️.
- **Modern 3D UI:** glassmorphism, gradients, animations — fully responsive (mobile bottom-nav).

## 🛠 Tech Stack

**Frontend:** React (Vite) · React Router · Socket.io-client · Axios
**Backend:** Node.js · Express · Socket.io · JWT · Mongoose
**Database:** MongoDB Atlas
**Media:** Cloudinary
**Hosting:** Vercel (frontend) · Render (backend)

## 📁 Structure

```
Depressd/
├── client/        # React + Vite frontend
│   ├── src/
│   │   ├── api/         # axios, socket, avatar helpers
│   │   ├── components/  # Navbar, PostCard, modals, etc.
│   │   ├── context/     # Auth + Theme providers
│   │   └── pages/       # Home, Upload, Chats, Friends, Profile, auth
│   └── vercel.json
├── server/        # Express + Socket.io backend
│   ├── config/    # db + cloudinary
│   ├── models/    # User, Post, Message, Group
│   ├── routes/    # auth, users, posts, messages, groups, friends
│   ├── socket/    # real-time chat, groups, friend events
│   └── middleware/
├── render.yaml    # backend deploy config
└── DEPLOYMENT.md  # full deploy guide
```

## 🚀 Run locally

**1. Backend**
```bash
cd server
npm install
npm run dev      # http://localhost:5000
```

**2. Frontend** (new terminal)
```bash
cd client
npm install
npm run dev      # http://localhost:5173
```

Open http://localhost:5173, sign up, and go. To test chat/friends/groups, open a second browser (or incognito) as another user.

## 🔑 Environment variables

Create these from the provided `.env.example` files (never commit real secrets):

**`server/.env`**
```
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_random_secret
JWT_EXPIRES=7d
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**`client/.env`**
```
VITE_API_URL=http://localhost:5000
```

## ☁️ Deployment

- **Frontend → Vercel** (builds from `client/`)
- **Backend → Render** (Express + Socket.io need an always-on server — reads `render.yaml`)

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the full step-by-step guide. In short: deploy the backend to Render, set `VITE_API_URL` on Vercel to the Render URL, then set `CLIENT_URL` on Render to the Vercel URL. Push to `main` → both auto-redeploy.

> ⚠️ **Security:** rotate any MongoDB / Cloudinary / API credentials that were shared during development before going public.
