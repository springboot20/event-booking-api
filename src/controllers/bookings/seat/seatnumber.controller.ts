import { seatNumberModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/api.error";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

export const addNewSeat = asyncHandler(async (req: Request, res: Response) => {
  const { number, section, row } = req.body;

  const existingSeatNumber = await seatNumberModel.findOne({ number });

  if (existingSeatNumber) throw new ApiError(StatusCodes.CONFLICT, "Seat with the already exist");

  const seatNumber = await seatNumberModel.create({
    number,
    section,
    row,
  });

  await seatNumber.save();

  return new ApiResponse(StatusCodes.CREATED, { seatNumber }, "New Seat number successfully");
});

export const updateSeatNumber = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { section, row } = req.body;

  const updatedSeatNumber = await seatNumberModel.findByIdAndUpdate(
    id,
    {
      $set: {
        section,
        row,
      },
    },
    { new: true },
  );

  if (!updatedSeatNumber) throw new ApiError(StatusCodes.CONFLICT, "Seat number does not exist");

  return new ApiResponse(
    StatusCodes.OK,
    { seatNumber: updatedSeatNumber },
    "Seat number updated successfully",
  );
});

export const deleteSeatNumber = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const seatNumber = await seatNumberModel.findByIdAndDelete(id);

  if (!seatNumber) throw new ApiError(StatusCodes.CONFLICT, "Seat number does not exist");

  return new ApiResponse(StatusCodes.OK, {}, "New Seat number successfully");
});

export const getAllSeatNumbers = asyncHandler(async (req: Request, res: Response) => {
  const seatNumbers = await seatNumberModel.aggregate([
    {
      $match: {},
    },
    {
      $project: {
        number: 1,
        section: 1,
        row: 1,
      },
    },
    {
      $sort: {
        number: -1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { seatNumbers }, "Available Seat number fetched");
});
