import jsonwebtoken from 'jsonwebtoken';
import { userModel } from '../models/index';
import { ApiError } from './ApiError';
import { StatusCodes } from 'http-status-codes';
import { User } from '../types';
import { Response } from 'express';
import mongoose from 'mongoose';

const validateToken = (token: string, secret: string) => {
  try {
    const decodedToken = jsonwebtoken.verify(token, secret);
    return decodedToken;
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Something went wrong while verifying token'
    );
  }
};
const generateAccessToken = (payload: User) => {
  return jsonwebtoken.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY as string,
  });
};

const generateRefreshToken = (payload: { _id: string }) => {
  return jsonwebtoken.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY as string,
  });
};

const generateTokens = async (res: Response, userId: string) => {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found', []);
  }

  let accessPayload = {
    _id: user._id.toString(),
    username: user.username,
    role: user.role,
    email: user.email,
  };

  let refreshPayload = {
    _id: user._id.toString(),
  };

  let accessToken = generateAccessToken(accessPayload);
  let refreshToken = generateRefreshToken(refreshPayload);

  let options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
  };

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie('accessToken', accessToken, options);
  res.cookie('refreshToken', refreshToken, options);

  return { accessToken, refreshToken };
};

export { generateTokens, validateToken };
