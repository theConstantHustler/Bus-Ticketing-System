import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    // NOTE: This is not a validator. It creates an index in MongoDB to ensure uniqueness
    unique: true,
    match: /.+\@.+\..+/,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    // NOTE: This is not a validator. It creates an index in MongoDB to ensure uniqueness
    unique: true,
    // NOTE: This regex is for IN phone numbers only
    match: /^[6-9]\d{9}$/,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 8);
  next();
});

export default mongoose.model("User", userSchema);
