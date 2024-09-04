import { userModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/api.error";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { ROLE } from "../../../types/model/user";

export const register = asyncHandler(
  async (req: Request, res: Response) => {
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

    console.log(req.body)

    await user.save({ validateBeforeSave: false });

    const createdUser = await userModel
      .findById(user._id)
      .select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

    if (!createdUser) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "something went wrong when registering user",
      );
    }

    return new ApiResponse(StatusCodes.OK, { user: createdUser }, "User registration successful");
  },
);
