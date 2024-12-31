import mongoose from "mongoose";
import { SeatModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/api.error";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { Response } from "express";
import { CustomRequest } from "../../../types/index";

const reserveASeat = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;
  const { seats, reservedAt } = req.body;

  const _seat = await SeatModel.findOne({
    eventId: new mongoose.Types.ObjectId(eventId),
  });

  if (!_seat) throw new ApiError(StatusCodes.NOT_FOUND, "seats not found", []);

  const reservedSeats: any[] = [];
  const unavailableSeats: any[] = [];

  seats.forEach((s: string) => {
    const seat = _seat.seats.find((_s) => _s?._id?.toString() === s);

    if (!seat) {
      unavailableSeats.push(s);
    } else if (seat.isReserved) {
      unavailableSeats.push(s);
    } else {
      seat.isReserved = true;
      seat.reservedAt = reservedAt;
      seat.reservedBy = new mongoose.Types.ObjectId(req?.user?._id!);

      reservedSeats.push(seat);
    }
  });

  await _seat.save({ validateBeforeSave: true });

  if (unavailableSeats.length > 0) {
    return new ApiResponse(
      StatusCodes.CONFLICT,
      {
        reservedSeats,
        unavailableSeats,
      },
      "some seats could not be reserved"
    );
  }

  return new ApiResponse(StatusCodes.OK, { reservedSeats }, "seat booked successfully");
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
      $set: {
        seats: {
          $filter: {
            input: "$seats",
            as: "seat",
            cond: { $eq: ["$$seat.reservedBy", req?.user?._id] },
          },
        },
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, userSeatsAggregate[0], "user seats fetched");
});

export { reserveASeat, getAllAvailableSeats, fetchSeatAssociatedWithUser };
