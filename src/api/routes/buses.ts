import express from "express";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Bus from "../models/buses";
import Ticket from "../models/tickets";
import User from "../models/users";

import Joi from "joi";

import { HttpMethods, TicketStatus } from "../helper";

const router = express.Router();

// Gets all buses with their seat count and number of booked seats
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docs = await Bus.find().select("_id totalSeats bookedSeats").exec();

    const response = {
      count: docs.length,
      buses: docs.map((doc) => ({
        _id: doc._id,
        totalSeats: doc.totalSeats,
        bookedSeats: doc.bookedSeats,
        request: {
          type: HttpMethods.GET,
          description: "Get all open tickets for this bus",
          url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${doc._id}/tickets?status=open`,
        },
      })),
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An internal error occurred", details: err });
  }
});

// Gets the details of the user who booked a ticket of a bus with the given seat number
router.get(
  "/:busId/tickets/:seatNumber/userDetails",
  async (req: Request, res: Response) => {
    try {
      const { busId, seatNumber } = req.params;

      // Find the ticket
      const ticket = await Ticket.findOne({
        bus: busId,
        seatNumber: parseInt(seatNumber),
      }).exec();

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      // Find the user associated with the ticket
      const user = await User.findById(ticket.user?._id)
        .select("_id name email phone")
        .exec();

      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found for this ticket" });
      }

      // Return user details
      res.status(200).json({
        user: user,
        seatNumber: ticket.seatNumber,
        bus: ticket.bus?._id,
        status: ticket.status,
        request: {
          type: HttpMethods.GET,
          description: "Get the details of this ticket",
          url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${busId}/tickets/${seatNumber}`,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "An error occurred", error: error });
    }
  }
);

// Gets the details of a ticket of a bus with the given seat number like ticket status, price, etc.
router.get(
  "/:busId/tickets/:seatNumber",
  async (req: Request, res: Response) => {
    try {
      const busId = req.params.busId;
      const seatNumber = parseInt(req.params.seatNumber);

      // Validate and fetch the bus
      const bus = await Bus.findById(busId).exec();
      if (!bus) {
        return res.status(404).json({ message: "Invalid Bus ID" });
      }

      // Validate seat number
      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > bus.totalSeats) {
        return res.status(400).json({ message: "Invalid seat number" });
      }

      // Find the ticket with the seat number on the specified bus
      const doc = await Ticket.findOne({ bus: busId, seatNumber: seatNumber })
        .select("status bookingDate price seatNumber user")
        .exec();

      if (!doc) {
        return res.status(404).json({
          message: "No valid entry found for provided seat number",
        });
      }

      const response = {
        ticket: {
          status: doc.status,
          bookingDate: doc.bookingDate,
          price: doc.price,
          seatNumber: doc.seatNumber,
          user: doc.user,
          request: {
            type: HttpMethods.PATCH,
            description: "Edit the status or book this ticket",
            url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${busId}/tickets/${doc.seatNumber}`,
          },
        },
      };

      res.status(200).json(response);
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "An internal error occurred", details: err });
    }
  }
);

interface TicketQuery {
  bus: string;
  status?: string;
}

// Gets all tickets of a bus with the given status like open or closed
router.get("/:busId/tickets", async (req: Request, res: Response) => {
  try {
    const busId = req.params.busId;
    const status = req.query.status;

    // Validate the status, if provided
    if (
      status &&
      status !== TicketStatus.CLOSED &&
      status !== TicketStatus.OPEN
    ) {
      return res.status(400).json({ message: "Invalid ticket status" });
    }

    // Validate and fetch the bus
    const bus = await Bus.findById(busId).exec();
    if (!bus) {
      return res.status(404).json({ message: "Invalid Bus ID" });
    }

    let query: TicketQuery = { bus: busId };
    if (status) {
      query.status = status;
    }

    // Find tickets for the bus with the given status, if provided
    const docs = await Ticket.find(query).exec();

    const tickets = docs.map((doc) => ({
      bookingDate: doc.bookingDate,
      status: doc.status,
      price: doc.price,
      seatNumber: doc.seatNumber,
      request: {
        type: HttpMethods.PATCH,
        description: "Edit the status or book this ticket",
        url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${busId}/tickets/${doc.seatNumber}`,
      },
    }));

    const response = {
      count: docs.length,
      tickets: tickets,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An internal error occurred", details: err });
  }
});

const ticketUpdateSchema = Joi.object({
  userId: Joi.string().required(),
  status: Joi.string().valid(TicketStatus.CLOSED, TicketStatus.OPEN).required(),
});

// Updates the status of a ticket of a bus with the given seat number
// TODO: make this route accessible only to admins or the user who booked the ticket
router.patch(
  "/:busId/tickets/:seatNumber",
  async (req: Request, res: Response) => {
    try {
      const busId = req.params.busId;
      const seatNumber = parseInt(req.params.seatNumber);

      // Validate the request body
      const { error, value } = ticketUpdateSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ message: "Invalid request data", details: error.details });
      }

      const { userId, status } = value;

      // Validate the user ID
      const user = await User.findById(userId).exec();
      if (!user) {
        return res.status(404).json({ message: "Invalid User ID" });
      }

      if (user.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const bus = await Bus.findById(busId).exec();
      if (!bus) {
        return res.status(404).json({ message: "Invalid Bus ID" });
      }

      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > bus.totalSeats) {
        return res.status(400).json({ message: "Invalid seat number" });
      }

      const ticket = await Ticket.findOne({
        bus: busId,
        seatNumber: seatNumber,
      })
        .select("user bookingDate status price seatNumber bus")
        .exec();
      if (!ticket) {
        return res
          .status(404)
          .json({ message: "No valid entry found for provided seat number" });
      }

      // Update ticket and bus details
      ticket.status = status;
      if (status === TicketStatus.CLOSED) {
        ticket.user = userId;
        ticket.bookingDate = new Date();
        bus.bookedSeats += 1;
      } else if (status === TicketStatus.OPEN) {
        ticket.user = null;
        //@ts-ignore
        ticket.bookingDate = null;
        bus.bookedSeats -= 1;
      }

      await ticket.save();
      await bus.save();

      res.status(200).json({
        message: `Ticket with seat number ${seatNumber} updated successfully`,
        ticket,
        request: {
          type: HttpMethods.GET,
          description: "Get the details of this ticket",
          url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${busId}/tickets/${seatNumber}`,
        },
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "An internal error occurred", details: err });
    }
  }
);

export default router;
