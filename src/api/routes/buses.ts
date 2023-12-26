import express from "express";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Bus from "../models/buses";
import Ticket from "../models/tickets";
import User from "../models/users";

import { HttpMethods, TicketStatus } from "./tickets";
import Joi from "joi";

const router = express.Router();

// Gets all buses with their seat count and number of booked seats
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  Bus.find()
    .select("_id totalSeats bookedSeats")
    .exec()
    .then((docs) => {
      if (docs.length > 0) {
        const response = {
          count: docs.length,
          buses: docs.map((doc) => {
            return {
              _id: doc._id,
              totalSeats: doc.totalSeats,
              bookedSeats: doc.bookedSeats,
              request: {
                type: "GET",
                description: "Get all open tickets for this bus",
                url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${doc._id}/tickets?status=open`,
              },
            };
          }),
        };

        res.status(200).json(response);
      } else {
        res.status(200).json({ count: 0, buses: [] });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(404).json({ error: err });
    });
});

// Gets the details of a ticket of a bus with the given seat number like ticket status, price, etc.
router.get("/:busId/tickets/:seatNumber", (req: Request, res: Response) => {
  const busId = req.params.busId;
  const seatNumber = parseInt(req.params.seatNumber);

  // Validate and fetch the bus
  Bus.findById(busId)
    .exec()
    .then((bus) => {
      if (!bus) {
        return res.status(404).json({ message: "Invalid Bus ID" });
      }

      // Validate seat number
      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > bus.totalSeats) {
        return res.status(400).json({ message: "Invalid seat number" });
      }

      // Find the ticket with the seat number on the specified bus
      Ticket.findOne({ bus: busId, seatNumber: seatNumber })
        .select("status bookingDate price seatNumber user")
        .exec()
        .then((doc) => {
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
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ error: err });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

interface TicketQuery {
  bus: string;
  status?: string;
}

// Gets all tickets of a bus with the given status like open or closed
router.get("/:busId/tickets", (req: Request, res: Response) => {
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
  Bus.findById(busId)
    .exec()
    .then((bus) => {
      if (!bus) {
        return res.status(404).json({ message: "Invalid Bus ID" });
      }

      let query: TicketQuery = { bus: busId };
      if (status) {
        query.status = status;
      }

      // Find tickets for the bus with the given status, if provided
      Ticket.find(query)
        .exec()
        .then((docs) => {
          if (docs.length > 0) {
            const response = {
              count: docs.length,
              tickets: docs.map((doc) => {
                return {
                  bookingDate: doc.bookingDate,
                  status: doc.status,
                  price: doc.price,
                  seatNumber: doc.seatNumber,
                  request: {
                    type: HttpMethods.PATCH,
                    description: "Edit the status or book this ticket",
                    url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${busId}/tickets/${doc.seatNumber}`,
                  },
                };
              }),
            };

            res.status(200).json(response);
          } else {
            res.status(200).json({ count: 0, tickets: [] });
          }
        })
        .catch((err) => {
          console.log(err);
          res.status(404).json({ error: err });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(404).json({ error: err });
    });
});

const ticketUpdateSchema = Joi.object({
  userId: Joi.string().required(),
  status: Joi.string().valid(TicketStatus.CLOSED, TicketStatus.OPEN).required(),
});

// Updates the status of a ticket of a bus with the given seat number
// TODO: make this route accessible only to admins or the user who booked the ticket
router.patch("/:busId/tickets/:seatNumber", (req: Request, res: Response) => {
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
  User.findById(userId)
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "Invalid User ID" });
      }

      if (user.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({
        error: "An error occurred while fetching user",
        details: err.message,
      });
    });

  Bus.findById(busId)
    .exec()
    .then((bus) => {
      if (!bus) {
        return res.status(404).json({ message: "Invalid Bus ID" });
      }

      if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > bus.totalSeats) {
        return res.status(400).json({ message: "Invalid seat number" });
      }

      Ticket.findOne({ bus: busId, seatNumber: seatNumber })
        .select("user bookingDate status price seatNumber bus")
        .exec()
        .then((ticket) => {
          if (!ticket) {
            return res.status(404).json({
              message: "No valid entry found for provided seat number",
            });
          }

          ticket.status = status;
          if (status === TicketStatus.CLOSED) {
            ticket.user = userId;
            ticket.bookingDate = new Date();
          } else if (status === TicketStatus.OPEN) {
            ticket.user = null;
            // @ts-ignore
            ticket.bookingDate = null;
          }

          ticket
            .save()
            .then((result) => {
              res.status(200).json({
                message: `Ticket with seat number ${seatNumber} updated successfully`,
                ticket: result,
              });
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({ error: err });
            });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({ error: err });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(404).json({ error: err });
    });
});

export default router;
