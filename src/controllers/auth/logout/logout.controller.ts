import { userModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { CustomRequest } from "../../../types/index";
import { Response } from "express";

export const logout = asyncHandler(async (req: CustomRequest, res: Response) => {
  await userModel.findByIdAndUpdate(
    req["user"]!._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true },
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(StatusCodes.OK)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options);

  return new ApiResponse(StatusCodes.OK, {}, "user logged out successful");
});
