import express from "express";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import User from "../models/users";

import { HttpMethods } from "./tickets";

const router = express.Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  User.find()
    .select("_id name email phone createdAt updatedAt")
    .exec()
    .then((docs) => {
      if (docs.length > 0) {
        const response = {
          count: docs.length,
          users: docs.map((doc) => {
            return {
              _id: doc._id,
              name: doc.name,
              email: doc.email,
              phone: doc.phone,
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
              request: {
                type: HttpMethods.GET,
                url: `${process.env.DOMAIN}:${process.env.PORT}/users/${doc._id}`,
              },
            };
          }),
        };

        res.status(200).json(response);
      } else {
        res.status(200).json({ count: 0, users: [] });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while fetching users",
        details: err.message,
      });
    });
});

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
  });

  user
    .save()
    .then((result) => {
      res.status(201).json({
        message: `Successfully created a new user`,
        user: {
          _id: result._id,
          name: result.name,
          email: result.email,
          phone: result.phone,
          request: {
            type: HttpMethods.GET,
            url: `${process.env.DOMAIN}:${process.env.PORT}/users/${result._id}`,
          },
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

router.get("/:userId", (req: Request, res: Response, next: NextFunction) => {
  User.findById(req.params.userId)
    .select("_id name email phone createdAt updatedAt")
    .exec()
    .then((doc) => {
      if (doc) {
        console.log(doc);
        res.status(200).json({
          _id: doc._id,
          name: doc.name,
          email: doc.email,
          phone: doc.phone,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          request: {
            type: HttpMethods.GET,
            url: `${process.env.DOMAIN}:${process.env.PORT}/users/${doc._id}`,
          },
        });
      } else {
        res.status(404).json({
          message: "No valid entry found for provided ID",
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

router.patch("/:userId", (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.userId;
  const updateOpertions: {
    [key: string]: any;
  } = {};

  for (const ops of req.body) {
    updateOpertions[ops.key] = ops.value;
  }

  User.updateOne({ _id: id }, { $set: updateOpertions })
    .exec()
    .then((result) => {
      if (!result.acknowledged) {
        return res.status(404).json({
          message: `No valid entry found for provided ID ${id}`,
          success: result.acknowledged,
        });
      }
      res.status(200).json({
        message: `Successfully updated user with ID ${id}`,
        success: result.acknowledged,
        request: {
          type: HttpMethods.GET,
          url: `${process.env.DOMAIN}:${process.env.PORT}/users/${id}`,
        },
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while updating user",
        details: err.message,
      });
    });
});

router.delete("/:userId", (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.userId;
  res.status(200).json({
    message: `Handling DELETE requests to /users/${id}`,
    id,
  });
});

export default router;
