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
    event: {
      type: {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    },
    seats: {
      type: [
        {
          type: Types.ObjectId,
          ref: "Seat",
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
