import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import mongoose from "mongoose";

// Import environment variables from .env file
import "dotenv/config";

import ticketRoutes from "./api/routes/tickets";
import usersRoutes from "./api/routes/users";

// Initialize express
const app = express();

// Middleware for logging incoming requests
app.use(morgan("dev"));

// Middleware for parsing the body of incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
// Middleware for parsing JSON in the body of incoming requests
app.use(bodyParser.json());

// NOTE: The following code is not needed for the current project but is included for reference
//        and to demonstrate how to handle CORS errors while serving the API
app.use((req: Request, res: Response, next: NextFunction) => {
  // Allow access from any origin
  res.header("Access-Control-Allow-Origin", "*");
  // Allow access for any headers (incl. Authorization, etc.)
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  // Allow access for any HTTP request (GET, POST, PUT, DELETE, etc.)
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
    return res.status(200).json({});
  }
  next();
});

// Routes which should handle requests
app.use("/tickets", ticketRoutes);
app.use("/users", usersRoutes);

// Connect to MongoDB Atlas database
mongoose.connect(
  `mongodb+srv://${process.env.MONGO_ATLAS_USER}:${process.env.MONGO_ATLAS_PW}@authenticatebackend.puhr1qv.mongodb.net/?retryWrites=true&w=majority`
);

// Error handling for non-existent routes
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new Error("Not found");
  res.status(404);
  next(error);
});

// Error handling for all other errors (e.g. database errors)
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  res.status(res.statusCode || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

export default app;
