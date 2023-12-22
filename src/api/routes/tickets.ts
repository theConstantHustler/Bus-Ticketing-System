import express, { Request, Response, NextFunction } from "express";
import Ticket from "../models/tickets";
import mongoose from "mongoose";

const router = express.Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  Ticket.find()
    .exec()
    .then((docs) => {
      if (docs.length > 0) {
        console.log(docs);
        res.status(200).json(docs);
      } else {
        res.status(200).json({ message: "No tickets found", tickets: [] });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(404).json({ error: err });
    });
});

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  const ticket = new Ticket({
    _id: new mongoose.Types.ObjectId(),
    busNumber: req.body.busNumber,
    assignedTo: req.body.assignedTo,
    createdAt: new Date().toISOString(),
    status: req.body.status,
    price: req.body.price,
    route: req.body.route,
  });

  ticket
    .save()
    .then((result) => {
      console.log(result);
      res.status(201).json({
        message: "Successfully created a new ticket",
        ticket,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

router.get("/:ticketId", (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.ticketId;
  Ticket.findById(id)
    .exec()
    .then((doc) => {
      if (doc) {
        console.log(doc);
        res.status(200).json(doc);
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
        console.log(result);
        res.status(200).json({
          message: `Successfully updated ticket with ID ${id}`,
          id,
        });
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

    Ticket.findByIdAndDelete(id)
      .exec()
      .then(() => {
        res.status(200).json({
          message: `Successfully deleted ticket with ID ${id}`,
          id,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: err });
      });
  }
);

export default router;
