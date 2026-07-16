import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Group from "../models/Group.js";

// Map of userId -> Set of socketIds (a user may have multiple tabs)
const onlineUsers = new Map();

const addUser = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

const removeSocket = (socketId) => {
  for (const [userId, sockets] of onlineUsers) {
    if (sockets.delete(socketId) && sockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }
};

const socketsOf = (userId) => [...(onlineUsers.get(userId) || [])];

export default function initSocket(io) {
  // Authenticate every socket connection with the JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    addUser(uid, socket.id);
    io.emit("onlineUsers", [...onlineUsers.keys()]);

    // Personal room for targeted notifications (friend requests, etc.)
    socket.join(`user:${uid}`);

    // Join a socket.io room for each group this user belongs to
    Group.find({ members: uid })
      .select("_id")
      .then((groups) =>
        groups.forEach((g) => socket.join(`group:${g._id}`))
      )
      .catch(() => {});

    // ---- Direct (1:1) chat ----
    socket.on("sendMessage", async ({ receiver, text, image }) => {
      try {
        if (!text?.trim() && !image) return;
        const message = await Message.create({
          sender: uid,
          receiver,
          text: text || "",
          image: image || "",
        });
        // deliver to receiver's sockets
        socketsOf(receiver).forEach((sid) =>
          io.to(sid).emit("newMessage", message)
        );
        // echo back to sender's other tabs
        socket.emit("newMessage", message);
      } catch (err) {
        socket.emit("errorMessage", { message: "Message failed to send" });
      }
    });

    socket.on("typing", ({ receiver }) => {
      socketsOf(receiver).forEach((sid) =>
        io.to(sid).emit("typing", { from: uid })
      );
    });

    // ---- Group chat ----
    // called when a user creates/opens a group so their socket joins the room live
    socket.on("joinGroup", (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on("sendGroupMessage", async ({ group, text, image }) => {
      try {
        if (!text?.trim() && !image) return;
        // verify membership before broadcasting
        const g = await Group.findById(group).select("members");
        if (!g || !g.members.some((m) => m.toString() === uid)) return;
        const created = await Message.create({
          sender: uid,
          group,
          text: text || "",
          image: image || "",
        });
        const message = await created.populate("sender", "name avatar");
        io.to(`group:${group}`).emit("newGroupMessage", message);
      } catch (err) {
        socket.emit("errorMessage", { message: "Group message failed" });
      }
    });

    socket.on("typingGroup", ({ group, name }) => {
      socket.to(`group:${group}`).emit("typingGroup", { group, from: uid, name });
    });

    socket.on("disconnect", () => {
      removeSocket(socket.id);
      io.emit("onlineUsers", [...onlineUsers.keys()]);
    });
  });
}
