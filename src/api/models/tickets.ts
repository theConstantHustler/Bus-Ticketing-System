import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  busNumber: String,
  assignedTo: String,
  createdAt: Date,
  status: String,
  price: Number,
  route: String,
});

export default mongoose.model("Ticket", ticketSchema);
