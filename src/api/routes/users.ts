import express from "express";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwtMiddleware from "../middleware/jwt";

import User from "../models/users";

import { HttpMethods } from "../helper";

const router = express.Router();

// Sign up a new user
router.post(
  "/signup",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existingUser = await User.find({ email: req.body.email }).exec();

      // If user already exists, return 409 Conflict
      if (existingUser.length >= 1) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Don't allow creation of admin users
      if (req.body.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = new User({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
      });

      const result = await user.save();

      res.status(201).json({
        message: "Successfully created a new user",
        user: {
          _id: result._id,
          name: result.name,
          email: result.email,
          phone: result.phone,
          request: {
            type: "GET",
            url: `${process.env.DOMAIN}:${process.env.PORT}/users/${result._id}`,
          },
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while creating user",
        details: err,
      });
    }
  }
);

// Get all the user details by ID
router.get(
  "/",
  jwtMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const docs = await User.find()
        .select("_id name email phone createdAt updatedAt isAdmin")
        .exec();

      const users = docs.map((doc) => {
        // Omit Admin user details except for the name
        if (doc.isAdmin) {
          return { name: doc.name };
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
      });

      const response = { count: docs.length, users };

      res.status(200).json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while fetching users",
        details: err,
      });
    }
  }
);

// Get the user details by ID - only Admin users can get users
router.get(
  "/:userId",
  jwtMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId;

      const doc = await User.findById(userId)
        .select("_id name email phone createdAt updatedAt")
        .exec();

      if (!doc) {
        return res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }

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
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while fetching user",
        details: err,
      });
    }
  }
);

// Update a user by ID - only Admin users can update users
router.patch(
  "/:userId",
  jwtMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.userId;
      const updateOperations: { [key: string]: any } = {};

      for (const ops of req.body) {
        updateOperations[ops.key] = ops.value;
      }

      const result = await User.updateOne(
        { _id: id },
        { $set: updateOperations }
      ).exec();
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
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while updating user",
        details: err,
      });
    }
  }
);

// Delete a user by ID - only Admin users can delete users
router.delete(
  "/:userId",
  jwtMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.userId;

      const doc = await User.findOneAndDelete({ _id: id }).exec();
      if (!doc) {
        return res.status(404).json({ message: `No user found with ID ${id}` });
      }

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
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "An error occurred while deleting user",
        details: err,
      });
    }
  }
);

export default router;
