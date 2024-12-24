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

const reserveASeat = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      const { eventId } = req.params;
      const { seat, reservedAt } = req.body;

      const _seat = await SeatModel.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        seats: [{ $in: new mongoose.Types.ObjectId(seat) }],
      });

      if (!_seat) throw new ApiError(StatusCodes.NOT_FOUND, "Seat not found", []);

      const seatAlreadyBooked = _seat.seats.find((s) => s.isReserved);

      if (seatAlreadyBooked) throw new ApiError(StatusCodes.CONFLICT, "Seat already booked");

      _seat.seats[seat].isReserved = true;
      _seat.reservedAt = reservedAt;

      await _seat.save({ session });

      return new ApiResponse(StatusCodes.OK, _seat, "all seats fetched successfully");
    }
  )
);

const getAllAvailableSeats = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;

  const seats = await SeatModel.aggregate([
    {
      $match: {
        eventId: new mongoose.Types.ObjectId(eventId),
      },
    },
    {
      $group: {
        seats: {
          $push: "$$ROOT",
        },
        totalSeats: {
          $count: "$seats",
        },
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, seats, "all seats fetched successfully");
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

  return new ApiResponse(StatusCodes.OK, { userSeats: userSeatsAggregate }, "User events fetched");
});

export { reserveASeat, getAllAvailableSeats, fetchSeatAssociatedWithUser };
