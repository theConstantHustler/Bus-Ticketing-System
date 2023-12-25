import { expressjwt as jwt } from "express-jwt";
import { RequestHandler } from "express";

// Get JWT secret from environment variables
const jwtSecret = process.env.JWT_KEY;
if (!jwtSecret) {
  throw new Error("JWT_KEY is not defined in the environment variables");
}

// Middleware for verifying JWT tokens
const jwtMiddleware: RequestHandler = jwt({
  secret: jwtSecret,
  algorithms: ["HS256"],
});

export default jwtMiddleware;
