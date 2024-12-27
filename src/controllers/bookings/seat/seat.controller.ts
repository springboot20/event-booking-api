import mongoose from "mongoose";
import { SeatModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { withTransactions } from "../../../middlewares/transaction.middleware";
import { ApiError } from "../../../utils/api.error";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { Response } from "express";
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
        as: "event",
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
        associated_event: { $first: "$event" },
      },
    },
  ];
};

const reserveASeat = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;
  const { seat, reservedAt } = req.body;

  const _seat = await SeatModel.findOne({
    eventId: new mongoose.Types.ObjectId(eventId),
  });

  // check seat in seats

  let isSeat = _seat?.seats.find((s) => s?._id?.toString() === seat);

  if (!_seat || !isSeat) throw new ApiError(StatusCodes.NOT_FOUND, "Seat not found", []);

  if (isSeat?.isReserved) throw new ApiResponse(StatusCodes.CONFLICT, {}, "Seat already booked");

  isSeat.isReserved = true;
  _seat.reservedAt = reservedAt;

  await _seat.save();

  return new ApiResponse(StatusCodes.OK, {}, "seat booked successfully");
});

const getAllAvailableSeats = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;

  const seats = await SeatModel.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId),
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, seats[0], "all seats fetched successfully");
});

const fetchSeatAssociatedWithUser = asyncHandler(async (req: CustomRequest, res: Response) => {
  const userSeatsAggregate = await SeatModel.aggregate([
    {
      $match: {
        reservedBy: req.user!._id,
      },
    },
    ...seatPipeLineAggregation(),
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  return new ApiResponse(
    StatusCodes.OK,
    { userSeats: userSeatsAggregate[0] },
    "User events fetched"
  );
});

export { reserveASeat, getAllAvailableSeats, fetchSeatAssociatedWithUser };
