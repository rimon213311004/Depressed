import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    occupation: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: {
      type: String,
      default:
        "https://api.dicebear.com/7.x/thumbs/svg?seed=depressd",
    },
    bio: { type: String, default: "", maxlength: 300 },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // requests this user has received (pending)
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // requests this user has sent (pending)
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model("User", userSchema);
