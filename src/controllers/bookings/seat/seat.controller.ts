import mongoose from "mongoose";
import { SeatModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
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

  if (isSeat?.isReserved) return new ApiResponse(StatusCodes.CONFLICT, {}, "Seat already booked");

  isSeat.isReserved = true;
  isSeat.reservedAt = reservedAt;
  isSeat.reservedBy = new mongoose.Types.ObjectId(req?.user?._id!);

  await _seat.save();

  return new ApiResponse(StatusCodes.OK, {}, "seat booked successfully");
});

const getAllAvailableSeats = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId, isReserved } = req.query;

  let filter: any = {};

  if (isReserved !== undefined && isReserved !== "") {
    filter.isReserved = JSON.parse(isReserved as string);
  }

  const seats = await SeatModel.findOne({
    eventId: new mongoose.Types.ObjectId(eventId as string),
  });

  const _seats = seats?.seats?.filter((s) => {
    if (filter.isReserved !== "") {
      return s.isReserved === filter.isReserved;
    }
  });

  return new ApiResponse(
    StatusCodes.OK,
    isReserved !== undefined && isReserved !== "" ? _seats : seats,
    "all seats fetched successfully"
  );
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
