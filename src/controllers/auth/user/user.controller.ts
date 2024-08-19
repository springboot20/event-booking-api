import { userModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { withTransactions } from "../../../middlewares/transaction.middleware";
import { ApiError } from "../../../utils/ApiError";
import {
  removeLocalFilepath,
  getLocalFilePath,
  getStaticFilePath,
  isPasswordCorrect,
} from "../../../utils/helpers";
import { ApiResponse } from "../../../utils/ApiResponse";
import { StatusCodes } from "http-status-codes";
import { CustomRequest } from "../../../types/index";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import mongoose from "mongoose";

export const resetPassword = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      const { resetToken } = req.params;
      const { newPassword } = req.body;

      const user = await userModel.findOne({
        _id: req["user"]!._id,
        forgotPasswordExpiry: {
          $gte: Date.now(),
        },
      });

      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Token is invalid or expired", []);
      }

      const validToken = await bcrypt.compare(resetToken, user?.forgotPasswordToken!);

      if (!validToken)
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid reset password token provided");

      user.forgotPasswordToken = undefined;
      user.forgotPasswordExpiry = undefined;

      user.password = newPassword as string;

      await user.save({ validateBeforeSave: false, session });

      return res
        .status(200)
        .json(new ApiResponse(StatusCodes.OK, {}, "Password reset successfully"));
    },
  ),
);

export const updateUserAvatar = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
    
      if (!req.file) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "user avatar image is required");
      }

      const avatarLocalFilePath = getLocalFilePath(req.file?.filename);
      const avatarStaticFilePath = getStaticFilePath(req, req.file?.filename);

      const user = await userModel
        .findByIdAndUpdate(
          req["user"]!._id,
          {
            $set: {
              avatar: {
                url: avatarStaticFilePath,
                localPath: avatarLocalFilePath,
              },
            },
          },
          { new: true },
        )
        .select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

      await user!.save({ session });

      removeLocalFilepath(user!.avatar?.type.localPath as string);

      return res.status(200).json(new ApiResponse(StatusCodes.OK, { user }, "User avatar updated"));
    },
  ),
);

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  return new ApiResponse(StatusCodes.OK, { currentUser: req.user }, "Current user fetched");
});

export const changeCurrentPassword = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      let { existingPassword, newPassword } = req.body;

      const user = await userModel.findById(req["user"]!._id);

      if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, "ser not found", []);
      }

      let isPasswordValid = isPasswordCorrect(existingPassword, user.password);

      if (!isPasswordValid) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Existing password does not matched");
      }

      user.password = newPassword;
      await user.save({ validateBeforeSave: false, session });

      return res.status(200).json(new ApiResponse(StatusCodes.OK, {}, "Current password changed"));
    },
  ),
);
