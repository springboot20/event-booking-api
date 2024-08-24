import { validationResult } from "express-validator";
import { ApiError } from "../utils/api.error";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";

const validate = (req: Request, res: Response, next: NextFunction) => {
  const validateResult = validationResult(req);

  if (validateResult.isEmpty()) {
    return next();
  } else {
    let extractedErrors: any[] = [];
    validateResult.array().map((error: any) => extractedErrors.push({ [error.path]: error.msg }));

    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Received data is not valid",
      extractedErrors,
    );
  }
};

export { validate };
