import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Direct message target (mutually exclusive with `group`)
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Group message target (mutually exclusive with `receiver`)
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    text: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Conversation lookups are by the pair of participants, or by group
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ group: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);
