import express from "express";
import { Request, Response, NextFunction } from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    message: "Handling GET requests to /users",
  });
});

router.post("/", (req: Request, res: Response, next: NextFunction) => {
  const user = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  };
  res.status(200).json({
    message: "Handling POST requests to /users",
    user,
  });
});

router.get("/:userId", (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.userId;
  res.status(200).json({
    message: `Handling GET requests to /users/${id}`,
    id,
  });
});

router.patch("/:userId", (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.userId;
  res.status(200).json({
    message: `Handling PATCH requests to /users/${id}`,
    id,
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
