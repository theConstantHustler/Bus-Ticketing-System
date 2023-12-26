import mongoose from "mongoose";

import Bus from "../models/buses";
import Ticket from "../models/tickets";

function initializeBus(seatCount: number, price: number) {
  const newBus = new Bus({
    _id: new mongoose.Types.ObjectId(),
    totalSeats: seatCount,
    bookedSeats: 0,
  });

  newBus
    .save()
    .then((bus) => {
      console.log(`Bus with ${seatCount} seats initialized`);

      // Create ticket for each seat
      for (let i = 0; i < seatCount; i++) {
        const newTicket = new Ticket({
          _id: new mongoose.Types.ObjectId(),
          bus: bus._id,
          seatNumber: i + 1,
          price,
        });

        newTicket
          .save()
          .catch((err) => console.error("Error creating ticket:", err));
      }
    })
    .catch((err) => console.error("Error initializing bus:", err));
}

export default initializeBus;
