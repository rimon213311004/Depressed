import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import messageRoutes from "./routes/messages.js";
import groupRoutes from "./routes/groups.js";
import friendRoutes from "./routes/friends.js";
import initSocket from "./socket/index.js";

await connectDB();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://client-ashen-pi.vercel.app",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

const io = new Server(server, { cors: corsOptions });
app.set("io", io); // make io reachable in route handlers via req.app.get("io")
initSocket(io);

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => res.send("Depressd API is running 💙"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/friends", friendRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
