import express from "express";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Bus from "../models/bus";

const router = express.Router();

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
                url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${doc._id}`,
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

export default router;
