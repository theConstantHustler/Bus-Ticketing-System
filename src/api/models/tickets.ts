import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookingDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["open", "pending", "confirmed", "cancelled"],
    default: "pending",
  },
  price: {
    type: Number,
    required: true,
  },
  seatNumber: {
    type: Number,
    required: true,
    unique: true,
  },
});

export default mongoose.model("Ticket", ticketSchema);
