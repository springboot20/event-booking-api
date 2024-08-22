import { model, Schema } from "mongoose";

const seatSchema = new Schema(
  {
    seatNumber: {
      type: Schema.Types.ObjectId,
      ref: "SeatNumber",
    },
    seatNumbers: {
      type: [{ type: Schema.Types.ObjectId, ref: "SeatNumber" }],
    },
    reservedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isReserved: {
      type: Boolean,
      default: false,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    reservedAt: {
      type: Date,
    },
    reservationExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

const seatNumberSchema = new Schema({
  number: {
    type: Number,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  row: {
    type: String,
    required: true,
  },
});

const seatModel = model("Seat", seatSchema);
const seatNumberModel = model("SeatNumber", seatNumberSchema);

export { seatModel, seatNumberModel };
