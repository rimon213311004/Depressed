import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { uploadAvatar, uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

const sanitize = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  occupation: u.occupation,
  age: u.age,
  avatar: u.avatar,
  bio: u.bio,
  socialLinks: u.socialLinks,
});

// @route GET /api/users  -> list all users (for chat sidebar / discover)
router.get("/", protect, async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select(
    "name avatar occupation"
  );
  res.json(users);
});

// @route GET /api/users/:id
router.get("/:id", protect, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(sanitize(user));
});

// @route PUT /api/users/profile  -> update own profile (bio, occupation, social links)
router.put("/profile", protect, async (req, res) => {
  const { name, occupation, bio, age, facebook, instagram } = req.body;
  const user = req.user;
  if (name !== undefined) user.name = name;
  if (occupation !== undefined) user.occupation = occupation;
  if (bio !== undefined) user.bio = bio;
  if (age !== undefined) user.age = age;
  user.socialLinks.facebook = facebook ?? user.socialLinks.facebook;
  user.socialLinks.instagram = instagram ?? user.socialLinks.instagram;
  await user.save();
  res.json(sanitize(user));
});

// @route PUT /api/users/avatar  -> update profile picture
router.put("/avatar", protect, uploadAvatar.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image uploaded" });
  const result = await uploadToCloudinary(req.file.buffer, {
    folder: "depressd/avatars",
    resourceType: "image",
  });
  req.user.avatar = result.secure_url;
  await req.user.save();
  res.json(sanitize(req.user));
});

export default router;
