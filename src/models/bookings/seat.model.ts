import { model, Schema } from "mongoose";

const seatSchema = new Schema({
  number: {
    type: Number,
    required: true,
  },
  isReserved: {
    type: Boolean,
    default: false,
  },
});

const SeatSchema = new Schema(
  {
    seats: [seatSchema],
    reservedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    reservedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const SeatModel = model("Seat", SeatSchema);

export { SeatModel };
