import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Ticket from "../models/tickets";
import User from "../models/users";

const router = express.Router();

export const HttpMethods = {
  GET: "GET",
  POST: "POST",
} as const;

enum TicketStatus {
  OPEN = "open",
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  Ticket.find()
    .select("_id user bookingDate status price seatNumber")
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

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  User.findById(req.body.user)
    .exec()
    .then((user) => {
      if (user) {
        const ticket = new Ticket({
          _id: new mongoose.Types.ObjectId(),
          user: req.body.user,
          price: req.body.price,
          seatNumber: req.body.seatNumber,
          status: TicketStatus.CONFIRMED,
        });

        ticket
          .save()
          .then((result) => {
            res.status(201).json({
              message: "Successfully created a new ticket",
              ticket: {
                _id: result._id,
                user: {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  request: {
                    type: HttpMethods.GET,
                    url: `${process.env.DOMAIN}:${process.env.PORT}/users/${user._id}`,
                  },
                },
                bookingDate: result.bookingDate,
                status: result.status,
                price: result.price,
                seatNumber: result.seatNumber,
                request: {
                  type: HttpMethods.GET,
                  url: `${process.env.DOMAIN}:${process.env.PORT}/tickets/${result._id}`,
                },
              },
            });
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({ error: err });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

router.get("/:ticketId", (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.ticketId;
  Ticket.findById(id)
    .populate("user", "name email phone")
    .exec()
    .then((doc) => {
      if (doc) {
        const response = {
          ticket: {
            _id: doc._id,
            user: doc.user,
            bookingDate: doc.bookingDate,
            status: doc.status,
            price: doc.price,
            seatNumber: doc.seatNumber,
            request: {
              type: HttpMethods.GET,
              description: "Get all tickets",
              url: `${process.env.DOMAIN}:${process.env.PORT}/tickets`,
            },
          },
        };
        res.status(200).json(response);
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

router.patch(
  "/:ticketId",
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
  "/:ticketId",
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
