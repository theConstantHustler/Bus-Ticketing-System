import mongoose from "mongoose";
import { ITicket } from "../interfaces";

const ticketSchema = new mongoose.Schema<ITicket>({
  _id: mongoose.Schema.Types.ObjectId,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
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

export default mongoose.model<ITicket>("Ticket", ticketSchema);
