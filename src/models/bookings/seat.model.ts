import { model, Schema } from 'mongoose';

const seatSchema = new Schema(
  {
    seatNumber: {
      type: Number,
      require: true,
      unique:true
    },
    reservedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    event:{
      type:Schema.Types.ObjectId,
      ref:"Event",
      unique:true
    },
    reservedAt: {
      type: Date,
    },
    reservationExpiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const seatModel = model('Seat', seatSchema);
export { seatModel };
