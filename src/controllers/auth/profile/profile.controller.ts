import { ProfileModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { CustomRequest } from "../../../types/index";
import { Response } from "express";
import { ApiError } from "../../../utils/api.error";

const getProfile = () => {
  return [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              _id: 1,
              avatar: 1,
              email: 1,
              password: 1,
              username: 1,
              role: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: { $first: "$user" },
      },
    },
  ];
};

export const updateUserProfile = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { firstname, lastname, phoneNumber } = req.body;

  const userProfile = await ProfileModel.findOneAndUpdate(
    { user: req?.user?._id },
    {
      $set: {
        firstname,
        lastname,
        phoneNumber,
      },
    },
    { new: true }
  );

  await userProfile!.save({ validateBeforeSave: true });

  if (!userProfile)
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error while trying to update user profile",
      []
    );

  return new ApiResponse(StatusCodes.OK, userProfile, "User profile updated successfully");
});

export const getUserProfile = asyncHandler(async (req: CustomRequest, res: Response) => {
  const profile = await ProfileModel.aggregate([
    {
      $match: {
        user: req?.user?._id,
      },
    },
    ...getProfile(),
  ]);

  const _profile = profile[0];

  return new ApiResponse(
    StatusCodes.OK,
    { profile: _profile },
    "user profile fetched successfully"
  );
});
