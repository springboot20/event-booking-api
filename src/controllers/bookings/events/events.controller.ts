import mongoose from "mongoose";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { EventModel, EventCategoryModel, SeatModel } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/api.error";
import { ApiResponse } from "../../../utils/api.response";
import { CustomRequest } from "../../../types/index";
import {
  deleteFileFromCloudinary,
  uploadFileToCloudinary,
} from "../../../configs/cloudinary.config";
import { aggreagetPaginate } from "../../../utils/helpers";

type Seat = mongoose.Types.DocumentArray<{
  number: number;
  isReserved: boolean;
  reservedAt?: Date;
  reservedBy?: mongoose.Types.ObjectId;
}>;

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

const createEvent = asyncHandler(async (req: CustomRequest, res: Response) => {
  const owner = req.user?._id;

  const {
    title,
    description,
    price,
    location,
    eventDate,
    category,
    from,
    to,
    featured,
    capacity,
    ticket_type,
  } = req.body;

  // if (!req.file) {
  //   throw new ApiError(StatusCodes.NOT_FOUND, "no image uploaded");
  // }

  let uploadImage;

  // if (req.file) {
  //   uploadImage = await uploadFileToCloudinary(
  //     req.file.buffer,
  //     `${process.env.CLOUDINARY_BASE_FOLDER}/events-image`
  //   );
  // }

  let event_category = await EventCategoryModel.findOne({ name: category });

  if (!event_category) {
    event_category = await EventCategoryModel.create({
      name: category,
      owner: req?.user?._id,
    });
  }

  // image: {
  //   url: uploadImage?.secure_url,
  //   public_id: uploadImage?.public_id,
  // },

  let seats = [];

  for (let index = 1; index <= Number(capacity); index++) {
    seats.push({
      number: index,
      isReserved: false,
    });
  }

  let createdSeat = await SeatModel.create({
    seats: seats as Seat,
  });

  const createdEvent = await EventModel.create({
    title,
    owner,
    description,
    location,
    category: event_category?._id,
    eventDate,
    ticket_type,
    price,
    featured,
    seatId: createdSeat?._id,
    time: {
      from,
      to,
    },
    capacity,
  });

  createdSeat.eventId = createdEvent._id;
  await createdSeat.save();

  if (!createdEvent) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Internal server error");
  }

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, { event: createdEvent }, "Event created successfully"));
});

const searchForAvailableEvents = asyncHandler(async (req: Request, res: Response) => {
  const { title } = req.body;

  const availableEvent = await EventModel.aggregate([
    {
      $match: {
        title,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, availableEvent, "available events fetched");
});

const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 10, page = 1, title = "", featured } = req.query;

  let filter: any = { title: { $regex: title as string, $options: "i" } };

  if (featured !== undefined) {
    filter.featured = JSON.parse(featured as string);
  }

  const events = await EventModel.paginate(
    filter,
    aggreagetPaginate({
      limit: Number(limit),
      page: Number(page),
      customLabels: {
        totalDocs: "totalEvents",
        docs: "events",
      },
    })
  );

  return new ApiResponse(StatusCodes.OK, events, "all events fetched");
});

const getEventsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const category = await EventCategoryModel.findById(categoryId).select("name _id");

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, "category does not exists");
  }

  const event_category = await EventModel.aggregate([
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

  return new ApiResponse(StatusCodes.OK, event_category, "Available events fetched");
});

const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const event = await EventModel.findOne({ _id: eventId }).populate("category owner seatId").exec();

  if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "event does not exist");

  return new ApiResponse(StatusCodes.OK, event, "event fetched");
});

const updateEvent = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;
  const { capacity, category, ...rest } = req.body;

  const event = await EventModel.findById(eventId);
  const seat = await SeatModel.findOne({
    eventId: new mongoose.Types.ObjectId(eventId),
  });

  if (!event) {
    throw new ApiError(StatusCodes.NOT_FOUND, "event not found");
  }

  if (!seat) {
    throw new ApiError(StatusCodes.NOT_FOUND, "seat not found");
  }

  let uploadImage;
  let updatedFields = {
    owner: req?.user?._id,
    category: event?.category,
    capacity,
    ...rest,
  };

  if (req.file) {
    if (event?.image?.public_id) {
      await deleteFileFromCloudinary(event.image.public_id);
    }

    uploadImage = await uploadFileToCloudinary(
      req.file.buffer,
      `${process.env.CLOUDINARY_BASE_FOLDER}/events-image`
    );

    updatedFields.image = {
      url: uploadImage?.secure_url,
      public_id: uploadImage?.public_id,
    };
  }

  // Handle category update
  if (category) {
    const normalizedCategoryName = category.trim().toLowerCase();

    let existingCategory = await EventCategoryModel.findOne({ name: normalizedCategoryName });
    if (!existingCategory) {
      existingCategory = await EventCategoryModel.create({
        name: normalizedCategoryName,
        owner: req.user?._id,
      });

      updatedFields.category = existingCategory?._id;
    } else {
      updatedFields.category = existingCategory?._id;
    }
  }

  const updatedEvent = await EventModel.findByIdAndUpdate(
    eventId,
    {
      $set: updatedFields,
    },
    { new: true }
  );

  let seats = [];

  for (let index = 1; index <= Number(capacity); index++) {
    seats.push({
      number: index,
      isReserved: false,
    });
  }

  seat.seats = seats as Seat;

  if (!updatedEvent) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Error occur while updating event document");
  }

  await seat.save({ validateBeforeSave: true });
  await updatedEvent.save({ validateBeforeSave: true });

  return new ApiResponse(StatusCodes.OK, updatedEvent, "Event updated");
});

const deleteEvent = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { eventId } = req.params;

  const event = await EventModel.findById(eventId);

  if (!event) throw new ApiError(StatusCodes.NOT_FOUND, "event does not exist");

  if (event.image.public_id && event.image.public_id !== null)
    await deleteFileFromCloudinary(event.image.public_id);

  const deletedEvent = await EventModel.findByIdAndDelete(eventId);
  const deletedEventSeat = await SeatModel.deleteOne({
    eventId,
  });

  if (!deletedEventSeat) {
    throw new ApiError(StatusCodes.NOT_FOUND, "seat does not exists");
  }

  console.log(deletedEventSeat);

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
