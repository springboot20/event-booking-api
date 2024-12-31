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
  reservedAt: {
    type: Date,
  },
  reservedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const SeatSchema = new Schema(
  {
    seats: [seatSchema],
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
  },
  { timestamps: true }
);

const SeatModel = model("Seat", SeatSchema);

export { SeatModel };
