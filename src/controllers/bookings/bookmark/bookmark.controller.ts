import { Response } from "express";
import { BookmarkModel, EventModel, SeatModel } from "../../../models/index";
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
        pipeline: [
          {
            $project: {
              _id: 1,
              price: 1,
              title: 1,
              description: 1,
              image: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        event: { $first: "$event" },
      },
    },
    {
      $lookup: {
        from: "seats",
        foreignField: "eventId",
        localField: "bookmarkItems.event",
        as: "seatData",
      },
    },
    {
      $unwind: "$seatData",
    },
    {
      $addFields: {
        bookedseats: {
          $filter: {
            input: "$seatData.seats",
            as: "seat",
            cond: {
              $in: ["$$seat._id", "$bookmarkItems.seats"],
            },
          },
        },
      },
    },
    {
      $addFields: {
        totalBookedSeats: {
          $size: "$bookedseats",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        bookmarkItems: {
          $push: {
            event: "$event",
            seats: "$bookedseats",
          },
        },
        totalBookmark: {
          $sum: {
            $multiply: ["$event.price", "$totalBookedSeats"],
          },
        },
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

  let newSeats = [...new Set([...seats])] as mongoose.Types.ObjectId[];

  const addedEvent = bookmark?.bookmarkItems?.find((e: any) => e.event.toString() === eventId);

  if (addedEvent) {
    addedEvent.seats = [...newSeats, ...addedEvent.seats] as mongoose.Types.ObjectId[];
  } else {
    bookmark?.bookmarkItems.push({
      event: new mongoose.Types.ObjectId(eventId),
      seats: newSeats,
    });
  }

  await bookmark?.save({ validateBeforeSave: true });

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

  const bookmark = await BookmarkModel.findOne({
    markedBy: req.user?._id,
  });

  if (!bookmark) throw new ApiError(StatusCodes.NOT_FOUND, "Bookmark not found for this event");

  const bookmarkItem = bookmark?.bookmarkItems?.find(
    (item: any) => item.event.toString() === eventId
  );

  if (!bookmark || !bookmarkItem?.seats.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "No seats found to found");
  }

  const seatIdsToRestore = bookmarkItem?.seats;

  await SeatModel.updateMany(
    {
      eventId,
      "seats._id": { $in: seatIdsToRestore },
    },
    {
      $set: {
        "seats.$[seat].isReserved": false,
      },

      $unset: {
        "seats.$[seat].reservedBy": "",
        "seats.$[seat].reservedAt": "",
      },
    },
    {
      arrayFilters: [
        {
          "seat._id": {
            $in: seatIdsToRestore,
          },
        },
      ],
    }
  );

  const updatedBookmark = await BookmarkModel.findOneAndUpdate(
    {
      markedBy: req?.user?._id,
    },
    {
      $pull: {
        bookmarkItems: {
          event: eventId,
        },
      },
    }
  );

  const userBookmark = {
    _id: updatedBookmark?._id || null,
    bookmarkItems: updatedBookmark?.bookmarkItems || [],
    totalBookmark: 0,
  };

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
 