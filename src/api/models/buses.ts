import mongoose from "mongoose";

const busSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  totalSeats: { type: Number, required: true },
  bookedSeats: { type: Number, required: true, default: 0 },
});

export default mongoose.model("Bus", busSchema);
