import express from "express";
import Post from "../models/Post.js";
import { protect } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

// @route POST /api/posts  -> create post (optional image/video + optional external link)
router.post("/", protect, upload.single("media"), async (req, res) => {
  try {
    const { caption, externalLink } = req.body;
    let mediaUrl = "";
    let mediaType = "none";
    if (req.file) {
      const isVideo = req.file.mimetype.startsWith("video/");
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: "depressd/posts",
        resourceType: isVideo ? "video" : "image",
      });
      mediaUrl = result.secure_url;
      mediaType = isVideo ? "video" : "image";
    }
    if (!caption && !mediaUrl && !externalLink) {
      return res.status(400).json({ message: "Post cannot be empty" });
    }
    const post = await Post.create({
      author: req.user._id,
      caption: caption || "",
      mediaUrl,
      mediaType,
      externalLink: externalLink || "",
    });
    const populated = await post.populate("author", "name avatar occupation");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/posts  -> feed (newest first)
router.get("/", protect, async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("author", "name avatar occupation")
    .populate("comments.user", "name avatar");
  res.json(posts);
});

// @route GET /api/posts/user/:id  -> posts by a user (profile page)
router.get("/user/:id", protect, async (req, res) => {
  const posts = await Post.find({ author: req.params.id })
    .sort({ createdAt: -1 })
    .populate("author", "name avatar occupation")
    .populate("comments.user", "name avatar");
  res.json(posts);
});

// @route PUT /api/posts/:id/like  -> toggle like
router.put("/:id/like", protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  const uid = req.user._id.toString();
  const idx = post.likes.findIndex((l) => l.toString() === uid);
  if (idx === -1) post.likes.push(req.user._id);
  else post.likes.splice(idx, 1);
  await post.save();
  res.json({ likes: post.likes });
});

// @route POST /api/posts/:id/comment
router.post("/:id/comment", protect, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Comment cannot be empty" });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  post.comments.push({ user: req.user._id, text });
  await post.save();
  const populated = await post.populate("comments.user", "name avatar");
  res.status(201).json(populated.comments);
});

// @route PUT /api/posts/:id/share  -> increment share counter
router.put("/:id/share", protect, async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { shares: 1 } },
    { new: true }
  );
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json({ shares: post.shares });
});

// @route DELETE /api/posts/:id  -> delete own post
router.delete("/:id", protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }
  await post.deleteOne();
  res.json({ message: "Post deleted" });
});

export default router;
