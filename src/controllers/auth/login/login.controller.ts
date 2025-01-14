import { UserModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { generateTokens } from "../../../utils/jwt";
import { ApiError } from "../../../utils/api.error";
import { isPasswordCorrect } from "../../../utils/helpers";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });

  if (!email && !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please provide email and password", []);
  }

  const isPasswordValid = await isPasswordCorrect(password, user?.password);

  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid password, try again", []);
  }

  const { accessToken, refreshToken } = await generateTokens(res, user!._id.toString());

  user!.isAuthenticated = true;

  await user!.save({ validateBeforeSave: false });

  const loggedInUser = await UserModel.findById(user!._id).select(
    "-password -emailVerificationToken -emailVerificationExpiry"
  );

  return new ApiResponse(
    StatusCodes.OK,
    {
      user: loggedInUser,
      tokens: { accessToken, refreshToken },
    },
    "user logged in successfully"
  );
});
