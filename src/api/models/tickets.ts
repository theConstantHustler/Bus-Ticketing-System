import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  bookingDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open",
  },
  price: {
    type: Number,
    required: true,
  },
  seatNumber: {
    type: Number,
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bus",
  },
});

// Create a compound index for bus and seatNumber
// This will ensure that a bus has only one ticket with a particular seatNumber
ticketSchema.index({ bus: 1, seatNumber: 1 }, { unique: true });

export default mongoose.model("Ticket", ticketSchema);
