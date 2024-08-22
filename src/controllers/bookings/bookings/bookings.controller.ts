import {  Response } from "express";
import mongoose from "mongoose";
import { bookingModel } from "../../../models/bookings/booking.model";
import { eventModel } from "../../../models/bookings/event.model";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/ApiError";
import { ApiResponse } from "../../../utils/ApiResponse";
import { StatusCodes } from "http-status-codes";
import { CustomRequest } from "../../../types/index";

const getBookings = async (
  userId: string,
): Promise<{
  _id: string;
  bookingItems: { _id: string; event: any; ticket: number }[];
  bookingTotal: number;
}> => {
  const bookingsAggregate = await bookingModel.aggregate([
    {
      $match: {
        bookedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $unwind: "$bookingItems",
    },
    {
      $lookup: {
        from: "events",
        localField: "bookingItems.eventId",
        foreignField: "_id",
        as: "event",
      },
    },
    {
      $project: {
        event: { $first: "$event" },
      },
    },
    {
      $group: {
        _id: "$_id",
        bookingItems: {
          $push: "$$ROOT",
        },
        bookingTotal: {
          $sum: {
            $mulitply: ["$event.price", "$ticket"],
          },
        },
      },
    },
  ]);

  return (
    bookingsAggregate[0] ?? {
      _id: null,
      bookingItems: [],
      bookingTotal: 0,
    }
  );
};

const bookEvent = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;
  const { ticket } = req.body;

  const event = await eventModel.findById(eventId);

  const bookings = await bookingModel.findOne({
    bookedBy: req.user!._id,
  });

  if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "event does not exist");

  if (ticket > event.capacity) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      event.capacity > 0
        ? `only ${event.capacity} capacity left that can contain `
        : "out of event capacity",
    );
  }

  const addedEvent = bookings.bookingItems.find((item: any) => item.eventId.toString() === eventId);

  if (addedEvent) {
    addedEvent.ticket = ticket;
  } else {
    bookings.bookigItems.push({
      eventId,
      ticket,
    });
  }

  await bookings.save({ validateBeforeSave: true });

  const userBooking = await getBookings(req.user?._id!);

  return new ApiResponse(StatusCodes.OK, userBooking, "Booking successful");
});

const removeEventItemFromBooking = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;

  const event = await eventModel.findById(eventId);

  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Booking detail not found");
  }

  const updatedBooking = await bookingModel.findOneAndUpdate(
    {
      bookedBy: req.user?._id,
    },
    {
      $pull: {
        bookingItems: {
          eventId,
        },
      },
    },
    { new: true },
  );

  await updatedBooking.save({ validateBeforeSave: true });

  return new ApiResponse(StatusCodes.OK, updatedBooking, "Booking updated");
});

const getUserBooking = asyncHandler(async (req: CustomRequest, res: Response) => {
  const userBooking = await getBookings(req.user?._id!);

  return new ApiResponse(StatusCodes.OK, userBooking, "Booking updated");
});

export { bookEvent, removeEventItemFromBooking, getUserBooking };
