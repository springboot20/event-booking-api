import { UserModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/api.error";
import { isPasswordCorrect } from "../../../utils/helpers";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { CustomRequest } from "../../../types/index";
import { Response } from "express";
import {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
} from "../../../configs/cloudinary.config";
import { validateToken } from "../../../utils/helpers";

export const resetPassword = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { resetToken } = req.query;
  const { newPassword, email } = req.body;

  const user = await UserModel.findOne({ email });

  console.log(user);
  console.log(user?.forgotPasswordToken);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Token is invalid or expired", []);
  }

  const validToken = validateToken(
    typeof resetToken === "string" ? resetToken : "",
    user?.forgotPasswordToken as string
  );

  console.log(validToken);

  if (!validToken)
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid reset password token provided");

  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  user.password = newPassword as string;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(StatusCodes.OK, {}, "Password reset successfully"));
});

export const updateUserAvatar = asyncHandler(async (req: CustomRequest, res: Response) => {
  const db_user = await UserModel.findById(req?.user?._id);

  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "user avatar image is required");
  }

  let uploadImage;

  if (req.file) {
    if (db_user?.avatar?.public_id && db_user?.avatar?.public_id !== null) {
      await deleteFileFromCloudinary(db_user?.avatar?.public_id);
    }

    uploadImage = await uploadFileToCloudinary(
      req.file.buffer,
      `${process.env.CLOUDINARY_BASE_FOLDER}/users-image`
    );
  }

  const user = await UserModel.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: {
          url: uploadImage?.secure_url,
          public_id: uploadImage?.public_id,
        },
      },
    },
    { new: true }
  ).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

  await user!.save();

  return res.status(200).json(new ApiResponse(StatusCodes.OK, { user }, "User avatar updated"));
});

export const getCurrentUser = asyncHandler(async (req: CustomRequest, res: Response) => {
  const user = await UserModel.findById(req?.user?._id).select(
    "-emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
  );

  return new ApiResponse(StatusCodes.OK, user, "Current user fetched");
});

export const changeCurrentPassword = asyncHandler(async (req: CustomRequest, res: Response) => {
  let { existingPassword, newPassword } = req.body;

  const user = await UserModel.findById(req?.user?._id);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "user not found", []);
  }

  let isPasswordValid = await isPasswordCorrect(existingPassword, user?.password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Existing password does not matched");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(StatusCodes.OK, {}, "Current password changed"));
});
