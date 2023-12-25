import mongoose from "mongoose";

import Bus from "../models/bus";

function initializeBus(seatCount: number) {
  const newBus = new Bus({
    _id: new mongoose.Types.ObjectId(),
    totalSeats: seatCount,
    bookedSeats: 0,
  });

  newBus
    .save()
    .then(() => console.log(`Bus with ${seatCount} seats initialized`))
    .catch((err) => console.error("Error initializing bus:", err));
}

export default initializeBus;
