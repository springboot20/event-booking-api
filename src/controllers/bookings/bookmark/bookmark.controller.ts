import { Response } from 'express';
import mongoose from 'mongoose';
import { BookmarkModel, EventModel } from '../../../models/index';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ApiError } from '../../../utils/api.error';
import { ApiResponse } from '../../../utils/api.response';
import { StatusCodes } from 'http-status-codes';
import { CustomRequest } from '../../../types/index';
import { withTransactions } from '../../../middlewares/transaction.middleware';

export const getBookmark = async (userId: string) => {
  const userBookmark = await BookmarkModel.aggregate([
    {
      $match: {
        markedBy: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $unwind: '$bookmarkItems',
    },
    {
      $lookup: {
        from: 'events',
        localField: 'bookmarkItems.event',
        foreignField: '_id',
        as: 'event',
      },
    },
    {
      $project: {
        event: { $first: '$event' },
        ticket: '$bookmarkItems.ticket',
      },
    },
    {
      $group: {
        _id: '$_id',
        bookmarkItems: {
          $push: '$$ROOT',
        },
        totalBookmark: {
          $sum: {
            $multiply: ['$event.price', '$ticket'],
          },
        },
      },
    },
    {
      $addFields: {
        totalBookmark: '$totalBookmark',
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

  return new ApiResponse(StatusCodes.OK, { bookmark: userBookmark }, 'bookmark fetched');
});

export const addEventToBookmark = asyncHandler(
  withTransactions(async (req: CustomRequest, res: Response, session: mongoose.ClientSession) => {
    const { eventId } = req.params;
    const { ticket = 1 } = req.body;

    const bookmark = await BookmarkModel.findOne({
      markBy: req.user?._id,
    });

    const event = await EventModel.findById(eventId).session(session);
    if (!event) throw new ApiError(StatusCodes.NOT_FOUND, 'event not found');

    if (ticket > event.capacity) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `only ${event.capacity} is remaining. But you are board ${ticket}. Event out of capacity`
      );
    }

    const addedEvent = bookmark?.bookmarkItems?.find((e) => e.event.toString() === eventId);

    if (addedEvent) {
      addedEvent.ticket = ticket;
    } else {
      bookmark?.bookmarkItems.push({
        event: new mongoose.Types.ObjectId(eventId),
        ticket,
      });
    }

    await bookmark?.save({ validateBeforeSave: false, session });

    const userBookmark = await getBookmark(req.user?._id!);

    return new ApiResponse(
      StatusCodes.CREATED,
      { bookmark: userBookmark },
      'event added to bookmark'
    );
  })
);

export const removeEventFromBookmark = asyncHandler(
  withTransactions(async (req: CustomRequest, res: Response, session: mongoose.ClientSession) => {
    const { eventId } = req.params;

    const event = await EventModel.findById(eventId).session(session);

    if (!event) throw new ApiError(StatusCodes.NOT_FOUND, 'event not found', []);

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
    ).session(session);

    const userBookmark = await getBookmark(req.user?._id as string);

    return new ApiResponse(
      StatusCodes.OK,
      { bookmark: userBookmark },
      'event removed from bookmark'
    );
  })
);

export const clearBookmark = asyncHandler(
  withTransactions(async (req: CustomRequest, res: Response, session: mongoose.ClientSession) => {
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

    return new ApiResponse(StatusCodes.OK, { bookmark: userBookmark }, 'bookmark cleared');
  })
);
