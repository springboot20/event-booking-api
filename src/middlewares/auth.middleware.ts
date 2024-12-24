import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { validateToken } from '../utils/jwt';
import { UserModel } from '../models/index';
import { ApiError } from '../utils/api.error';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { CustomRequest } from '../types';

const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken || req.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'verifyJWT Invalid');
  }

  try {
    let decodedToken = validateToken(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;

    const user = await UserModel.findById(decodedToken?._id).select(
      '-password -refreshToken -emailVerificationToken -emailVerificationExpiry'
    );

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Token provided');
    }

    console.log(user);

    req.user = user;
    next();
  } catch (error) {
    next(error);
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'verifyJWT Invalid');
  }
});

const checkUserPermissions = (...roles: string[]) => {
  return asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    // Log req.user for debugging
    console.log(req.user);

    // Ensure req.user exists and _id is present
    if (!req.user || !req.user?._id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized request');
    }

    // Check if the user's role is included in the allowed roles
    if (roles.includes(req.user?.role)) {
      return next();
    } else {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not allowed to perform this action');
    }
  });
};

export { verifyJWT, checkUserPermissions };
