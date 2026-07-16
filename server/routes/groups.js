import express from "express";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route POST /api/groups  -> create a group
router.post("/", protect, async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }
    // ensure creator is always a member + dedupe
    const memberIds = Array.from(
      new Set([...(members || []).map(String), req.user._id.toString()])
    );
    const group = await Group.create({
      name: name.trim(),
      admin: req.user._id,
      members: memberIds,
    });
    const populated = await group.populate("members", "name avatar occupation");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/groups  -> groups I'm a member of
router.get("/", protect, async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .sort({ updatedAt: -1 })
    .populate("members", "name avatar occupation");
  res.json(groups);
});

// @route GET /api/groups/:id  -> single group
router.get("/:id", protect, async (req, res) => {
  const group = await Group.findById(req.params.id).populate(
    "members",
    "name avatar occupation"
  );
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (!group.members.some((m) => m._id.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: "Not a member" });
  }
  res.json(group);
});

// @route GET /api/groups/:id/messages  -> group chat history
router.get("/:id/messages", protect, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (!group.members.some((m) => m.toString() === req.user._id.toString())) {
    return res.status(403).json({ message: "Not a member" });
  }
  const messages = await Message.find({ group: req.params.id })
    .sort({ createdAt: 1 })
    .populate("sender", "name avatar");
  res.json(messages);
});

// @route PUT /api/groups/:id/members  -> add members (admin only)
router.put("/:id/members", protect, async (req, res) => {
  const { members } = req.body;
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Group not found" });
  if (group.admin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Only the admin can add members" });
  }
  const set = new Set(group.members.map(String));
  (members || []).forEach((m) => set.add(String(m)));
  group.members = [...set];
  await group.save();
  const populated = await group.populate("members", "name avatar occupation");
  res.json(populated);
});

// @route PUT /api/groups/:id/leave  -> leave a group
router.put("/:id/leave", protect, async (req, res) => {
  const group = await Group.findById(req.params.id);
  if (!group) return res.status(404).json({ message: "Group not found" });
  group.members = group.members.filter(
    (m) => m.toString() !== req.user._id.toString()
  );
  // if admin leaves, hand admin to the first remaining member (or delete if empty)
  if (group.admin.toString() === req.user._id.toString()) {
    if (group.members.length === 0) {
      await group.deleteOne();
      return res.json({ message: "Group deleted" });
    }
    group.admin = group.members[0];
  }
  await group.save();
  res.json({ message: "Left group" });
});

export default router;
