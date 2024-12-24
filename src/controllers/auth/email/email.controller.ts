import { UserModel } from '../../../models/index';
import { asyncHandler } from '../../../utils/asyncHandler';
import { withTransactions } from '../../../middlewares/transaction.middleware';
import { ApiError } from '../../../utils/api.error';
import { generateTemporaryToken } from '../../../utils/helpers';
import { ApiResponse } from '../../../utils/api.response';
import { StatusCodes } from 'http-status-codes';
import { sendMail } from '../../../service/email.service';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CustomRequest } from 'src/types';
import bcrypt from 'bcrypt';

export const forgotPassword = asyncHandler(
  withTransactions(async (req: Request, res: Response, session: mongoose.mongo.ClientSession) => {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'user does not exists', []);
    }

    const { unHashedToken, hashedToken, tokenExpiry } = await generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = new Date(tokenExpiry);

    await user.save({ validateBeforeSave: false, session });

    const resetLink = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${
      user._id
    }/${unHashedToken}`;

    await sendMail(
      user?.email,
      'Password reset request',
      { resetLink, username: user?.username },
      'resetPasswordTemplate'
    );

    return new ApiResponse(
      StatusCodes.OK,
      {},
      'password reset link successfully sent to your email'
    );
  })
);

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { id, token } = req.params;

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'verification token is missing', []);
  }

  const user = await UserModel.findOne({
    _id: id,
    emailVerificationExpiry: { $gte: Date.now() },
  })!;

  console.log(user);

  if (!user)
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'unable to verify user, token invalid or expired');

  const validToken = await bcrypt.compare(token, user?.emailVerificationToken!);

  if (!validToken)
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid reset password token provided');

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;

  await user.save({ validateBeforeSave: false });

  return new ApiResponse(StatusCodes.OK, { isEmailVerified: true }, 'Email verified');
});

export const resendEmailVerification = asyncHandler(
  async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
    const user = await UserModel.findById(req['user']!._id);

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'user does not exists', []);
    }

    if (user.isEmailVerified) {
      throw new ApiError(StatusCodes.CONFLICT, 'user email has already been verified', []);
    }

    const { unHashedToken, hashedToken, tokenExpiry } = await generateTemporaryToken();

    user.emailVerificationExpiry = new Date(tokenExpiry);
    user.emailVerificationToken = hashedToken;

    await user.save({ validateBeforeSave: false, session });

    const verifyLink = `${req.protocol}://${req.get('host')}/api/v1/verify-email/${unHashedToken}`;

    await sendMail(
      user?.email,
      'Email verification',
      { username: user?.username, verificationLink: verifyLink },
      'emailVerificationTemplate'
    );
    return new ApiResponse(StatusCodes.OK, {}, 'Email verfication resent successfully');
  }
);
