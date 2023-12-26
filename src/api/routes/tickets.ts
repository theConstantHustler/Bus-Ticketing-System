import express, { Request, Response, NextFunction } from "express";
import jwtMiddleware from "../middleware/jwt";

import Ticket from "../models/tickets";

const router = express.Router();

export const HttpMethods = {
  GET: "GET",
  POST: "POST",
  PATCH: "PATCH",
} as const;

export enum TicketStatus {
  OPEN = "open",
  CLOSED = "closed",
}

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  const status = req.query.status;

  // Validate the status
  if (status !== TicketStatus.CLOSED && status !== TicketStatus.OPEN) {
    return res.status(400).json({ message: "Invalid ticket status" });
  }

  Ticket.find({ status })
    .select("_id user bookingDate status price seatNumber bus")
    .populate("user", "name email phone")
    .exec()
    .then((docs) => {
      if (docs.length > 0) {
        const response = {
          count: docs.length,
          tickets: docs.map((doc) => {
            return {
              _id: doc._id,
              user: doc.user,
              bookingDate: doc.bookingDate,
              status: doc.status,
              price: doc.price,
              seatNumber: doc.seatNumber,
              bus: doc.bus,
              request: {
                type: HttpMethods.GET,
                url: `${process.env.DOMAIN}:${process.env.PORT}/tickets/${doc._id}`,
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
});

router.patch(
  "/:seatNumber",
  (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.ticketId;
    const updateOpertions: {
      [key: string]: any;
    } = {};

    for (const ops of req.body) {
      updateOpertions[ops.key] = ops.value;
    }

    Ticket.updateOne({ _id: id }, { $set: updateOpertions })
      .exec()
      .then((result) => {
        if (!result.acknowledged) {
          res.status(400).json({
            message: `Couldn't update the ticket with ID ${id}`,
            success: result.acknowledged,
          });
        } else {
          res.status(200).json({
            message: `Successfully updated ticket with ID ${id}`,
            success: result.acknowledged,
            request: {
              type: HttpMethods.GET,
              url: `${process.env.DOMAIN}:${process.env.PORT}/tickets/${id}`,
            },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: err });
      });
  }
);

router.delete(
  "/:seatNumber",
  jwtMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.ticketId;

    Ticket.findOneAndDelete({ _id: id })
      .exec()
      .then((doc) => {
        if (!doc) {
          res.status(404).json({ message: `No ticket found with ID ${id}` });
        } else {
          res.status(200).json({
            message: `Successfully deleted ticket with ID ${id}`,
            request: {
              type: HttpMethods.POST,
              description: "Create a new ticket",
              url: `${process.env.DOMAIN}:${process.env.PORT}/tickets`,
              body: {
                user: "String",
                price: "Number",
                seatNumber: "Number",
              },
            },
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: err });
      });
  }
);

export default router;
