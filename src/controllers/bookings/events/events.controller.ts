import mongoose from "mongoose";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { eventModel, eventCategory } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { withTransactions } from "../../../middlewares/transaction.middleware";
import { ApiError } from "../../../utils/api.error";
import { ApiResponse } from "../../../utils/api.response";
import { CustomRequest } from "../../../types/index";
import { uploadFileToCloudinary } from "src/configs/cloudinary.config";
import { aggreagetPaginate } from "src/utils/helpers";
import { title } from "process";

const pipelineAggregation = (): mongoose.PipelineStage[] => {
  return [
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

      if (!req.file) {
        throw new ApiError(StatusCodes.NOT_FOUND, "no image uploaded");
      }

      let uploadImage;

      if (req.file) {
        uploadImage = await uploadFileToCloudinary(req.file.buffer, "event-bookings");
      }

      const event_category = await eventCategory.findById(category);

      if (!event_category) throw new ApiError(StatusCodes.NOT_FOUND, "category does not exist");

      const createdEvent = await eventModel.create({
        title,
        image: {
          url: uploadImage?.secure_url,
          public_id: uploadImage?.public_id,
        },
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

      await createdEvent.save({ session });

      if (!createdEvent) {
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

const searchForAvailableEvents = asyncHandler(async (req: Request, res: Response) => {
  const { title } = req.body;

  const availableEvent = await eventModel.aggregate([
    {
      $match: {
        title,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, availableEvent, "available events fetched");
});

const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10, page = 1, featured } = req.query;

  const eventsAggregate = eventModel.aggregate([
    {
      $match:
        title.length > 0
          ? {
              title: {
                $regex: title.trim(),
                $options: "i",
              },
            }
          : {},
    },
    {
      $match: featured
        ? {
            featured: Boolean(featured),
          }
        : {},
    },
  ]);

  const events = await eventModel.paginate(
    eventsAggregate,
    aggreagetPaginate({
      limit: Number(limit),
      page: Number(page),
      customLabels: {
        totalDocs: "totalProducts",
        docs: "products",
      },
    }),
  );

  return new ApiResponse(StatusCodes.OK, { events }, "all events fetched");
});

const getEventsByCategory = asyncHandler(async (req: Request, res: Response) => {
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
    ...pipelineAggregation(),
    {
      $sort: {
        updatedAt: -1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { category: event_category }, "Available events fetched");
});

const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const event = await eventCategory.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(eventId),
      },
    },
    ...pipelineAggregation(),
  ]);

  if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "event does not exist");

  return new ApiResponse(StatusCodes.OK, { event }, "Available events fetched");
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
  getAllEvents,
  createEvent,
  updateEvent,
  getEventById,
  getEventsByCategory,
  deleteEvent,
  searchForAvailableEvents,
};
