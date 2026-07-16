# Depressd 💙

A supportive MERN social platform where people can share, connect, and feel less alone.

## Features
- **Auth (JWT):** Signup captures name, email, occupation, age, password. Login + protected routes.
- **Navbar:** Home 🏠 · Upload 🎬 · Chats 💬 · Profile/Settings 👤
- **Posts (Facebook-style):** upload image or video, caption, like ❤️, comment 💬, share ↗
- **External share links:** attach Facebook / Instagram / any platform link to a post.
- **Real-time chat:** Socket.io messaging, online status, typing indicator.
- **Profile & settings:** edit name/occupation/age/bio, change avatar (Cloudinary), add social links.

## Tech
React (Vite) · Node/Express · MongoDB (Mongoose) · Socket.io · JWT · Cloudinary

## Run locally

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

Open http://localhost:5173, sign up, and go.

## Environment
- `server/.env` — MONGO_URI, JWT_SECRET, Cloudinary keys, PORT, CLIENT_URL
- `client/.env` — VITE_API_URL

> ⚠️ **Security:** rotate your MongoDB password and Cloudinary secret before deploying publicly — the ones in `.env` were shared during setup.
