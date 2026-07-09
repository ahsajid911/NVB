import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export function handleValidation(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: "Validation failed", details: errors.array() });
  }
  next();
}

export const chatValidation = [
  body("message").isString().trim().isLength({ min: 1, max: 2000 }).withMessage("Message must be 1-2000 characters"),
  body("conversationId").optional().isString(),
  body("history").optional().isArray({ max: 50 }),
  handleValidation,
];

export const symptomValidation = [
  body("symptoms").isString().trim().isLength({ min: 2, max: 2000 }).withMessage("Symptoms must be 2-2000 characters"),
  body("duration").optional().isString().trim().isLength({ max: 200 }),
  body("age").optional().isInt({ min: 0, max: 150 }),
  body("gender").optional().isIn(["male", "female", "other"]),
  body("notes").optional().isString().trim().isLength({ max: 1000 }),
  handleValidation,
];
