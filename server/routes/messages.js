import express from "express";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";
import { uploadAvatar, uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

// @route POST /api/messages/upload  -> upload a chat image, returns its URL
router.post("/upload", protect, uploadAvatar.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "depressd/chat",
      resourceType: "image",
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/messages/:userId  -> full conversation with a user
router.get("/:userId", protect, async (req, res) => {
  const me = req.user._id;
  const them = req.params.userId;
  const messages = await Message.find({
    $or: [
      { sender: me, receiver: them },
      { sender: them, receiver: me },
    ],
  }).sort({ createdAt: 1 });

  // mark their messages to me as read
  await Message.updateMany(
    { sender: them, receiver: me, read: false },
    { read: true }
  );

  res.json(messages);
});

// @route POST /api/messages  -> send (also emitted live via socket, this persists)
router.post("/", protect, async (req, res) => {
  const { receiver, text } = req.body;
  if (!receiver || !text) {
    return res.status(400).json({ message: "receiver and text required" });
  }
  const message = await Message.create({
    sender: req.user._id,
    receiver,
    text,
  });
  res.status(201).json(message);
});

export default router;
