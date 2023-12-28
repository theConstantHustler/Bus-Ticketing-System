import mongoose from "mongoose";

import { IBus } from "../interfaces";

const busSchema = new mongoose.Schema<IBus>({
  _id: mongoose.Schema.Types.ObjectId,
  totalSeats: { type: Number, required: true },
  bookedSeats: { type: Number, required: true, default: 0 },
});

export default mongoose.model<IBus>("Bus", busSchema);
