import mongoose from "mongoose";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { eventModel, eventCategory } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { withTransactions } from "../../../middlewares/transaction.middleware";
import { ApiError } from "../../../utils/ApiError";
import { ApiResponse } from "../../../utils/ApiResponse";
import { CustomRequest } from "../../../types/index";

const pipelineAggregation = (): mongoose.PipelineStage[] => {
  return [
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "user",
        pipeline: [
          {
            $project: {
              password: 0,
              refreshToken: 0,
              forgotPasswordToken: 0,
              forgotPasswordExpiry: 0,
              emailVerificationToken: 0,
              emailVerificationExpiry: 0,
              loginType: 0,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "categories",
        foreignField: "_id",
        localField: "category",
        as: "event_category",
        pipeline: [
          {
            $project: {
              name: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        event_category: {
          $first: "$event_category",
        },
      },
    },
  ];
};

const createEvent = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      const owner = req.user?._id;

      const { title, description, price, location, eventDate, category, from, to, capacity } =
        req.body;
      const event_category = await eventCategory.findById(category);

      if (!event_category) throw new ApiError(StatusCodes.NOT_FOUND, "category does not exist");

      const newEvent = await eventModel.create({
        title,
        owner,
        description,
        location,
        category,
        eventDate,
        price,
        time: {
          from,
          to,
        },
        capacity,
      });

      await newEvent.save({ session });

      const createdEvent = await eventModel.aggregate([
        {
          $match: {
            _id: newEvent._id,
          },
        },
        ...pipelineAggregation(),
      ]);

      const eventPayload = createdEvent[0];

      if (!eventPayload) {
        throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
      }

      return res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(StatusCodes.OK, { event: createdEvent }, "Event created successfully"),
        );
    },
  ),
);

const fetchEventsAssociatedWithUser = asyncHandler(async (req: CustomRequest, res: Response) => {
  const userEventAggregate = await eventModel.aggregate([
    {
      $match: {
        owner: req.user?._id,
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    ...pipelineAggregation(),
  ]);

  return new ApiResponse(StatusCodes.OK, { userEvents: userEventAggregate }, "User events fetched");
});

const searchForAvailableEvents = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const availableEvents = await eventModel.aggregate([
    {
      $match: {
        _id: {
          $ne: new mongoose.Types.ObjectId(eventId),
        },
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { availableEvents }, "Available events fetched");
});

const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 15 } = req.query;

  const events = await eventModel.aggregate([
    {
      $match: {},
    },
    {
      $limit: +limit,
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { events }, "all events fetched");
});

const getEventByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const category = await eventCategory.findById(categoryId).select("name _id");

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "category does not exists");
  }

  const event_category = await eventModel.aggregate([
    {
      $match: {
        category: new mongoose.Types.ObjectId(categoryId),
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { category: event_category }, "Available events fetched");
});

const updateEvent = asyncHandler(
  withTransactions(
    async (req: CustomRequest, res: Response, session: mongoose.mongo.ClientSession) => {
      const { eventId } = req.params;

      const updatedEvent = await eventModel.findByIdAndUpdate(
        eventId,
        {
          $set: { owner: req.user!._id, ...req.body },
        },
        { new: true },
      );

      if (!updatedEvent) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Error occur while updating event document");
      }

      await updatedEvent.save({ session });

      return new ApiResponse(StatusCodes.OK, { updatedEvent }, "Event updated");
    },
  ),
);

const deleteEvent = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;

  const deletedEvent = await eventModel.findByIdAndDelete(eventId);

  if (!deletedEvent) {
    throw new ApiError(StatusCodes.NOT_FOUND, "event does not exists");
  }

  return new ApiResponse(StatusCodes.OK, {}, "event deledted successfully");
});

export {
  getEventByCategory,
  createEvent,
  deleteEvent,
  getAllEvents,
  fetchEventsAssociatedWithUser,
  updateEvent,
  searchForAvailableEvents,
};
