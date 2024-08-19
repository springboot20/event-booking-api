import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../utils/ApiError';
import { removeUnusedMulterImageFilesOnError } from '../utils/helpers';
import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || error instanceof mongoose.Error ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR;
    let message = error.message || 'something went wrong';

    error = new ApiError(statusCode, message, error?.errors || [], error.stack);
  }

  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors)
      .map((item: any) => item.message)
      .join(',');
    error.statusCode = StatusCodes.NOT_FOUND;
  }

  if (err.code && err.code === 1100) {
    error.message = `duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value`;
    error.statusCode = StatusCodes.BAD_REQUEST;
  }

  if (err.name === 'CastError') {
    error.statusCode = StatusCodes.NOT_FOUND;
    error.message = `No item found with id:${err.value}`;
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    error.statusCode = StatusCodes.NOT_FOUND;
    error.message = 'Resource not found';
  }

  let response = { ...error, message: error.message, ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}) };

  next(err);
  removeUnusedMulterImageFilesOnError(req);
  return res.status(error.statusCode).json(response);
};

export { errorHandler };
