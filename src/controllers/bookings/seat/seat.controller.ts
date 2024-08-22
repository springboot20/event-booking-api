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

const reserveASeat = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      const { eventId } = req.params;
      const { seatNumberId, reservedAt } = req.body;

      let reservationTime = 20 * 60 * 1000;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + reservationTime);

      const bookedSeat = await seatModel.find({
        isReserved: false,
        event: eventId,
        seatNumber: seatNumberId,
      });

      if (!bookedSeat)
        throw new ApiError(StatusCodes.CONFLICT, "seat has already resvered or booked");

      const seat = await seatModel.create({
        reservedBy: req.user?._id,
        seatNumber: seatNumberId,
        reservedAt,
        event: eventId,
        isReserved: true,
        reservationExpiresAt: expiresAt,
      });

      await seat.save({ session });

      return new ApiResponse(StatusCodes.OK, { seat }, "Seat booked successfully");
    },
  ),
);

const reserveSeats = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      const { eventId } = req.params;
      const { seatNumbers, reservedAt } = req.body;

      let reservationTime = 20 * 60 * 1000;

      const now = new Date();
      const expiresAt = new Date(now.getTime() + reservationTime);

      const seats = await Promise.all(
        seatNumbers.map(async (seatNumber: string) => {
          return seatModel.findOne({
            isReserved: false,
            event: eventId,
            seatNumbers: { $in: seatNumber },
            $or: [
              {
                reservedAt: { $exists: false },
                reservationExpiresAt: { $lt: now },
              },
            ],
          });
        }),
      );

      if (seats.length !== seatNumbers.length)
        throw new ApiError(StatusCodes.CONFLICT, "Some seats has already resvered or booked");

      const new_seats = await seatModel.create({
        reservedBy: req.user?._id,
        seatNumbers,
        reservedAt,
        event: eventId,
        isReserved: true,
        reservationExpiresAt: expiresAt,
      });

      await new_seats.save({ session });

      return new ApiResponse(StatusCodes.OK, { seats: new_seats }, "Seat booked successfully");
    },
  ),
);

const getAllSeats = asyncHandler(async (req: Request, res: Response) => {
  const availableSeats = await seatModel.aggregate([
    {
      $match: {},
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

export { reserveSeats, reserveASeat, getAllSeats, fetchSeatsAssociatedWithUser };
