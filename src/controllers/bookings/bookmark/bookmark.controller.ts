import { Response } from "express";
import { BookmarkModel, EventModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/api.error";
import { ApiResponse } from "../../../utils/api.response";
import { StatusCodes } from "http-status-codes";
import { CustomRequest } from "../../../types/index";
import mongoose from "mongoose";

export const getBookmark = async (userId: string) => {
  const userBookmark = await BookmarkModel.aggregate([
    {
      $match: {
        markedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $unwind: "$bookmarkItems",
    },
    {
      $lookup: {
        from: "events",
        localField: "bookmarkItems.event",
        foreignField: "_id",
        as: "event",
      },
    },
    {
      $project: {
        event: { $first: "$event" },
        seats: "$bookmarkItems.seats",
        totalSeats: {
          $size: "$bookmarkItems.seats",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        bookmarkItems: {
          $push: "$$ROOT",
        },
        totalBookmark: {
          $sum: {
            $multiply: ["$event.price", "$totalSeats"],
          },
        },
      },
    },
    {
      $project: {
        totalSeats: 0,
      },
    },
    {
      $addFields: {
        totalBookmark: "$totalBookmark",
      },
    },
  ]);

  return (
    userBookmark[0] ?? {
      _id: null,
      bookmarkItems: [],
      totalBookmark: 0,
    }
  );
};

export const getUserBookmark = asyncHandler(async (req: CustomRequest, res: Response) => {
  const userBookmark = await getBookmark(req.user?._id as string);

  return new ApiResponse(StatusCodes.OK, { bookmark: userBookmark }, "bookmark fetched");
});

export const addEventToBookmark = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;
  const { seats } = req.body;

  const bookmark = await BookmarkModel.findOne({
    markedBy: req.user?._id,
  });

  const event = await EventModel.findById(eventId);
  if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "event not found");

  if (seats.length > event.capacity) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `only ${event.capacity} is remaining. But you board ${seats.length}. Event out of capacity`
    );
  }

  let newSeats = [...new Set([...seats])];

  const addedEvent = bookmark?.bookmarkItems?.find((e: any) => e.event.toString() === eventId);

  if (addedEvent) {
    addedEvent.seats = newSeats;
  } else {
    bookmark?.bookmarkItems.push({
      event: new mongoose.Types.ObjectId(eventId),
      seats: newSeats,
    });
  }

  console.log(addedEvent);

  await bookmark?.save({ validateBeforeSave: false });

  const userBookmark = await getBookmark(req.user?._id!);

  return new ApiResponse(
    StatusCodes.CREATED,
    { bookmark: userBookmark },
    "event added to bookmark"
  );
});

export const removeEventFromBookmark = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;

  const event = await EventModel.findById(eventId);

  if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "event not found", []);

  await BookmarkModel.findOneAndUpdate(
    { markBy: req.user?._id },
    {
      $pull: {
        bookmarkItems: {
          event: new mongoose.Types.ObjectId(eventId),
        },
      },
    },
    { new: true }
  );

  const userBookmark = await getBookmark(req.user?._id as string);

  return new ApiResponse(StatusCodes.OK, { bookmark: userBookmark }, "event removed from bookmark");
});

export const clearBookmark = asyncHandler(async (req: CustomRequest, res: Response) => {
  await BookmarkModel.findOneAndUpdate(
    { markBy: req.user?._id },
    {
      $set: {
        bookmarkItems: [],
      },
    },
    {
      new: true,
    }
  );
  const userBookmark = await getBookmark(req.user?._id as string);

  return new ApiResponse(StatusCodes.OK, { bookmark: userBookmark }, "bookmark cleared");
});
