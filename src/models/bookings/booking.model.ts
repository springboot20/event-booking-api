import { Schema, model } from "mongoose";

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
    seats: {
      type: [String],
      default: [],
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    bookingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    bookingId: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    status: {
      type: String,
      enum: Status,
      default: Status.PENDING,
    },
  },
  { timestamps: true }
);

export const BookingModel = model("Booking", bookingSchema);
