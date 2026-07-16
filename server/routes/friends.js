import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const card = "name avatar occupation bio";

// @route GET /api/friends  -> my friends, incoming & outgoing requests
router.get("/", protect, async (req, res) => {
  const me = await User.findById(req.user._id)
    .populate("friends", card)
    .populate("friendRequests", card)
    .populate("sentRequests", card);
  res.json({
    friends: me.friends,
    requests: me.friendRequests,
    sent: me.sentRequests,
  });
});

// @route GET /api/friends/suggestions  -> people you may know (not friends, no pending req)
router.get("/suggestions", protect, async (req, res) => {
  const me = await User.findById(req.user._id);
  const exclude = [
    me._id,
    ...me.friends,
    ...me.friendRequests,
    ...me.sentRequests,
  ].map(String);

  const suggestions = await User.find({ _id: { $nin: exclude } })
    .select(card)
    .limit(20);
  res.json(suggestions);
});

// @route POST /api/friends/request/:id  -> send a friend request
router.post("/request/:id", protect, async (req, res) => {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString()) {
    return res.status(400).json({ message: "You can't friend yourself" });
  }
  const me = await User.findById(req.user._id);
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: "User not found" });

  if (me.friends.some((f) => f.toString() === targetId)) {
    return res.status(400).json({ message: "Already friends" });
  }
  if (me.sentRequests.some((r) => r.toString() === targetId)) {
    return res.status(400).json({ message: "Request already sent" });
  }
  // if they already sent ME a request, accept it instead of duplicating
  if (me.friendRequests.some((r) => r.toString() === targetId)) {
    me.friendRequests.pull(targetId);
    me.friends.push(targetId);
    target.sentRequests.pull(me._id);
    target.friends.push(me._id);
    await me.save();
    await target.save();
    return res.json({ message: "You are now friends", status: "friends" });
  }

  me.sentRequests.push(targetId);
  target.friendRequests.push(me._id);
  await me.save();
  await target.save();

  // notify the target live
  const io = req.app.get("io");
  io?.to(`user:${targetId}`).emit("friendRequest", {
    from: { _id: me._id, name: me.name, avatar: me.avatar },
  });

  res.json({ message: "Friend request sent", status: "sent" });
});

// @route POST /api/friends/accept/:id  -> accept a received request
router.post("/accept/:id", protect, async (req, res) => {
  const fromId = req.params.id;
  const me = await User.findById(req.user._id);
  const from = await User.findById(fromId);
  if (!from) return res.status(404).json({ message: "User not found" });
  if (!me.friendRequests.some((r) => r.toString() === fromId)) {
    return res.status(400).json({ message: "No such request" });
  }
  me.friendRequests.pull(fromId);
  from.sentRequests.pull(me._id);
  me.friends.push(fromId);
  from.friends.push(me._id);
  await me.save();
  await from.save();

  const io = req.app.get("io");
  io?.to(`user:${fromId}`).emit("friendAccepted", {
    by: { _id: me._id, name: me.name, avatar: me.avatar },
  });

  res.json({ message: "Friend request accepted" });
});

// @route POST /api/friends/reject/:id  -> reject a received request
router.post("/reject/:id", protect, async (req, res) => {
  const fromId = req.params.id;
  const me = await User.findById(req.user._id);
  const from = await User.findById(fromId);
  me.friendRequests.pull(fromId);
  if (from) {
    from.sentRequests.pull(me._id);
    await from.save();
  }
  await me.save();
  res.json({ message: "Request rejected" });
});

// @route POST /api/friends/cancel/:id  -> cancel a request I sent
router.post("/cancel/:id", protect, async (req, res) => {
  const targetId = req.params.id;
  const me = await User.findById(req.user._id);
  const target = await User.findById(targetId);
  me.sentRequests.pull(targetId);
  if (target) {
    target.friendRequests.pull(me._id);
    await target.save();
  }
  await me.save();
  res.json({ message: "Request cancelled" });
});

// @route DELETE /api/friends/:id  -> unfriend
router.delete("/:id", protect, async (req, res) => {
  const otherId = req.params.id;
  const me = await User.findById(req.user._id);
  const other = await User.findById(otherId);
  me.friends.pull(otherId);
  if (other) {
    other.friends.pull(me._id);
    await other.save();
  }
  await me.save();
  res.json({ message: "Unfriended" });
});

export default router;
