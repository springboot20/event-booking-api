import mongoose from "mongoose";
import { seatModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { withTransactions } from "../../../middlewares/transaction.middleware";
import { ApiError } from "../../../utils/ApiError";
import { ApiResponse } from "../../../utils/ApiResponse";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { CustomRequest } from "../../../types/index";

const seatPipeLineAggregation = (): mongoose.PipelineStage[] => {
  return [
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "reservedBy",
        as: "reserver",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "events",
        foreignField: "_id",
        localField: "event",
        as: "associated_event",
        pipeline: [
          {
            $project: {
              owner: 0,
              location: 0,
              capacity: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        associated_event: { $first: "$associated_event" },
      },
    },
  ];
};

const reserveSeat = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      const { eventId } = req.params;
      const { seatNumber, reservedAt, reservationExpiresAt } = req.body;

      const isBooked = await seatModel.findOne({ isBooked: true });

      if (isBooked) throw new ApiError(StatusCodes.CONFLICT, "seat has been booked");

      const seat = await seatModel.create({
        reservedBy: req.user?._id,
        seatNumber,
        reservedAt,
        eventId,
        reservationExpiresAt,
      });

      await seat.save({ session });

      return new ApiResponse(StatusCodes.OK, { seat }, "Seat booked successfully");
    },
  ),
);

const searchForAvailableSeats = asyncHandler(async (req: Request, res: Response) => {
  const { seatId } = req.params;

  const availableSeats = await seatModel.aggregate([
    {
      $match: {
        _id: {
          $ne: new mongoose.Types.ObjectId(seatId),
        },
        isBooked: false,
      },
    },
    {
      $project: {
        seatNumber: 1,
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { availableSeats }, "Available events fetched");
});

const fetchSeatsAssociatedWithUser = asyncHandler(async (req: CustomRequest, res: Response) => {
  const userSeatsAggregate = await seatModel.aggregate([
    {
      $match: {
        owner: req.user!._id,
        isBooked: true,
      },
    },
    ...seatPipeLineAggregation(),
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { userSeats: userSeatsAggregate }, "User events fetched");
});

export { reserveSeat, searchForAvailableSeats, fetchSeatsAssociatedWithUser };
