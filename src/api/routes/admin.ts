import express from "express";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import jwtMiddleware from "../middleware/jwt";

import User from "../models/users";
import Bus from "../models/bus";
import Ticket from "../models/tickets";

const router = express.Router();

// Route to authenticate and get a token for admin users
router.get("/token", async (req: Request, res: Response) => {
  User.findOne({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user) {
        if (user.isAdmin) {
          // check if password is valid
          const passwordIsValid = bcrypt.compareSync(
            req.body.password,
            user.password
          );

          if (!passwordIsValid) {
            return res.status(401).json({
              message: "Wrong password",
            });
          }

          // sign the token
          const token = jwt.sign(
            {
              email: user.email,
              userId: user._id,
            },
            process.env.JWT_KEY as string,
            {
              algorithm: "HS256",
              expiresIn: "1h",
            }
          );

          return res.status(200).json({
            message: "Authentication successful",
            token: token,
          });
        } else {
          return res.status(401).json({
            message: "Unauthorized",
          });
        }
      } else {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while fetching user",
        details: err.message,
      });
    });
});

// Route to reset the tickets of a bus
router.patch(
  "/reset/:busId",
  jwtMiddleware,
  async (req: Request, res: Response) => {
    const id = req.params.busId;
    // check if bus exists
    const bus = await Bus.findById(id).exec();
    if (!bus) {
      return res.status(404).json({
        message: `Bus with ID ${id} does not exist`,
      });
    }

    // reset the tickets of the bus
    Bus.updateOne({ _id: id }, { $set: { bookedSeats: 0 } })
      .exec()
      .then((result) => {
        // delete all tickets of the bus
        Ticket.deleteMany({ bus: id }).exec();

        res.status(200).json({
          message: `Successfully reset tickets for bus with ID ${id}`,
          request: {
            type: "GET",
            url: `${process.env.DOMAIN}:${process.env.PORT}/buses/${id}`,
          },
        });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({
          error: "An error occurred while resetting tickets",
          details: err.message,
        });
      });
  }
);

export default router;
