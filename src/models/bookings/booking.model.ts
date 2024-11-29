import { Schema, model, Types } from "mongoose";

enum Status {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

const bookingSchema = new Schema(
  {
    bookedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingItems: {
      type: [
        {
          ticket: {
            type: Number,
            required: true,
            min: [1, "ticket must not less than 1"],
            default: 1,
          },
          eventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
          },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: Status,
      default: Status.PENDING,
    },
  },
  { timestamps: true },
);

export const bookingModel = model("Booking", bookingSchema);
