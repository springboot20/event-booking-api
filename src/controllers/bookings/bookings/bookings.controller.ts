import { Request, Response } from "express";
import mongoose from "mongoose";
import { bookingModel } from "../../../models/bookings/booking.model";
import { eventModel } from "../../../models/bookings/event.model";
import { asyncHandler } from "../../../utils/asyncHandler";
import { withTransactions } from "../../../middlewares/transaction.middleware";
import { ApiError } from "../../../utils/ApiError";
import { ApiResponse } from "../../../utils/ApiResponse";
import { StatusCodes } from "http-status-codes";
import { CustomRequest } from "../../../types/index";

const bookEvent = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      const { eventId, seatId } = req.params;

      const userBookings = await bookingModel.findOne({ bookedBy: req.user?._id });

      const userEvent = await eventModel.findById(eventId)
      
      if (!userEvent) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Not event booked by user");
      }



      // return new ApiResponse(StatusCodes.OK, { bookedEvent }, "Booking successful")
    },
  ),
);

const updateBooking = asyncHandler(
  withTransactions(async (req: Request, res: Response, session: mongoose.mongo.ClientSession) => {
    const { bookingId } = req.params;
    const { eventId, seatId } = req.body;


    const existingBooking = await bookingModel.findById(bookingId);
    if (!existingBooking) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Booking detail not found");
    }

    const updatedBooking = await bookingModel.findByIdAndUpdate(
      bookingId,
      {
        $push: {
          seats: seatId,
          events: eventId,
        },
      },
      { new: true },
    );

    if (!updatedBooking) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Error while updating booking");
    }

    await updatedBooking.save({ session });

    return res
      .status(200)
      .json(new ApiResponse(StatusCodes.OK, { updatedBooking }, "Booking updated"));
  }),
);

export { bookEvent, updateBooking };
