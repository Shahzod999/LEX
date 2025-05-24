import type { Request, Response, NextFunction } from "express";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      res.status(500).json({ message: `${error.message}` });
    });
  };

export default asyncHandler;
