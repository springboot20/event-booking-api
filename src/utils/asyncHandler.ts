import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "src/types";

const asyncHandler = (fn: Function) => {
  return async (req: Request | CustomRequest, res: Response, next: NextFunction) => {
    try {
      let nextCalled: boolean = false;
      let result = await fn(req, res, (params: any) => {
        nextCalled = true;
        next(params);
      });

      if (!res.headersSent && !nextCalled) {
        return res.status(200).json(result);
      }
    } catch (error) {
      next(error);
    }
  };
};

export { asyncHandler };
