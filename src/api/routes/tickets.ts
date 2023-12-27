import express, { Request, Response, NextFunction } from "express";
import jwtMiddleware from "../middleware/jwt";

import Ticket from "../models/tickets";

import { TicketStatus } from "../helper";

const router = express.Router();

// Gets all tickets with the given status like open or closed
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status;

    // Validate the status if provided
    if (
      status &&
      status !== TicketStatus.CLOSED &&
      status !== TicketStatus.OPEN
    ) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    const query = status ? { status } : {};
    const docs = await Ticket.find(query)
      .select("_id user bookingDate status price seatNumber bus")
      .populate("user", "name email phone")
      .exec();

    const tickets = docs.map((doc) => ({
      _id: doc._id,
      user: doc.user,
      bookingDate: doc.bookingDate,
      status: doc.status,
      price: doc.price,
      seatNumber: doc.seatNumber,
      bus: doc.bus,
      request: {
        type: "GET",
        url: `${process.env.DOMAIN}:${process.env.PORT}/tickets/${doc._id}`,
      },
    }));

    const response = { count: docs.length, tickets };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while fetching tickets",
      details: err,
    });
  }
});

// Delete a ticket by ID - only for admin
router.delete(
  "/:ticketId",
  jwtMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ticketId = req.params.ticketId;

      const doc = await Ticket.findOneAndDelete({ _id: ticketId }).exec();
      if (!doc) {
        return res
          .status(404)
          .json({ message: `No ticket found with ID ${ticketId}` });
      }

      res.status(200).json({
        message: `Successfully deleted ticket with ID ${ticketId}`,
        request: {
          type: "POST",
          description: "Create a new ticket",
          url: `${process.env.DOMAIN}:${process.env.PORT}/tickets`,
          body: {
            user: "String",
            price: "Number",
            seatNumber: "Number",
          },
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while deleting the ticket",
        details: err,
      });
    }
  }
);

export default router;
