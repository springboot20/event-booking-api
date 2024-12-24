import { UserModel } from '../../../models/index';
import { asyncHandler } from '../../../utils/asyncHandler';
import { generateTokens, validateToken } from '../../../utils/jwt';
import { ApiError } from '../../../utils/api.error';
import { ApiResponse } from '../../../utils/api.response';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';

const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response, session: mongoose.mongo.ClientSession) => {
    const {
      body: { inComingRefreshToken },
    } = req;

    try {
      const decodedRefreshToken = validateToken(
        inComingRefreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as JwtPayload;
      let user = await UserModel.findByIdAndUpdate(decodedRefreshToken?._id);

      if (!user) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid Token');
      }

      if (inComingRefreshToken !== user?.refreshToken) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token has expired or has already been used');
      }

      const { accessToken, refreshToken } = await generateTokens(res, user?._id.toString());
      user.refreshToken = refreshToken;
      await user.save({ session });

      return res
        .status(200)
        .json(
          new ApiResponse(
            StatusCodes.OK,
            { tokens: { accessToken, refreshToken } },
            'AccessToken refreshed successfully'
          )
        );
    } catch (error) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, `Error : ${error}`);
    }
  }
);

export { refreshAccessToken };
