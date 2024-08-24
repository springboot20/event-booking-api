import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { validateToken } from '../utils/jwt';
import { userModel } from '../models/index';
import { ApiError } from '../utils/api.error';
import { NextFunction, Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { CustomRequest } from 'src/types';

const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken || req.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'verifyJWT Invalid');
  }

  try {
    let decodedToken = validateToken(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;

    const user = await userModel
      .findById(decodedToken?._id)
      .select('-password -refreshToken -emailVerificationToken -emailVerificationExpiry');

    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Token provided');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'verifyJWT Invalid');
  }
});

const checkUserPermissions = (...roles: string[]) => {
  return asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req['user']!._id) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized request');
    }

    if (roles.includes(req['user']!.role)) {
      next();
    } else {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'you are not allow to perform such action');
    }
  });
};

export { verifyJWT, checkUserPermissions };
