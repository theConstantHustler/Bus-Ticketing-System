import express from "express";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwtMiddleware from "../middleware/jwt";

import User from "../models/users";

import { HttpMethods } from "./tickets";

const router = express.Router();

// Sign up a new user
router.post("/signup", (req: Request, res: Response, next: NextFunction) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      // If user already exists, return 409 Conflict
      if (user.length >= 1) {
        return res.status(409).json({
          message: "User already exists",
        });
      } else {
        // Don't allow creation of admin users
        if (req.body.isAdmin) {
          return res.status(401).json({
            message: "Unauthorized",
          });
        }

        const user = new User({
          _id: new mongoose.Types.ObjectId(),
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          phone: req.body.phone,
          ...(req.body.isAdmin ? { isAdmin: req.body.isAdmin } : {}),
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

router.get(
  "/",
  jwtMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    User.find()
      .select("_id name email phone createdAt updatedAt isAdmin")
      .exec()
      .then((docs) => {
        if (docs.length > 0) {
          const response = {
            count: docs.length,
            users: docs.map((doc) => {
              // Don't return Admin user details
              if (doc.isAdmin) {
                return {
                  name: doc.name,
                };
              }

              return {
                _id: doc._id,
                name: doc.name,
                email: doc.email,
                phone: doc.phone,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
                isAdmin: doc.isAdmin,
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
  }
);

router.get(
  "/:userId",
  jwtMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    User.findById(req.params.userId)
      .select("_id name email phone createdAt updatedAt")
      .exec()
      .then((doc) => {
        if (doc) {
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
  }
);

router.patch(
  "/:userId",
  jwtMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
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
  }
);

router.delete(
  "/:userId",
  jwtMiddleware,
  (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.userId;

    User.findOneAndDelete({ _id: id })
      .exec()
      .then((doc) => {
        if (!doc) {
          res.status(404).json({ message: `No user found with ID ${id}` });
        } else {
          res.status(200).json({
            message: `Successfully deleted user with ID ${id}`,
            request: {
              type: HttpMethods.POST,
              url: `${process.env.DOMAIN}:${process.env.PORT}/users`,
              body: {
                name: "String",
                email: "String",
                password: "String",
                phone: "String",
              },
            },
          });
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({
          error: "An error occurred while deleting user",
          details: err.message,
        });
      });
  }
);

export default router;
