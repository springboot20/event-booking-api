import { userModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/api.error";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { ROLE } from "../../../types/model/user";
import { generateTemporaryToken } from "src/utils/helpers";
import { sendMail } from "../../../service/email.service";
import { withTransactions } from "src/middlewares/transaction.middleware";
import mongoose from "mongoose";

export const register = asyncHandler(
  withTransactions(async (req: Request, res: Response, session: mongoose.ClientSession) => {
    const { username, email, role, password } = req.body;

    let existingUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, "User already exists in the database collection");
    }

    const user = new userModel({
      username,
      email,
      password,
      role: role || ROLE.USER,
      isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } = await generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry as unknown as Date;

    await user.save({ validateBeforeSave: false, session });

    const verifyLink = `${req.protocol}://${req.get("host")}/api/v1/verify-email/${unHashedToken}`;

    await sendMail(
      user?.email,
      "Email verification",
      { username: user?.username, verificationLink: verifyLink },
      "emailVerificationTemplate",
    );

    const createdUser = await userModel
      .findById(user._id)
      .select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

    if (!createdUser) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "something went wrong when registering user",
      );
    }

    return new ApiResponse(
      StatusCodes.OK,
      { user: createdUser },
      "User registration successfull and verification email has been sent to you email",
    );
  }),
);
