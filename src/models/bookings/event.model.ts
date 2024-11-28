import mongoose, { Schema, model, Model } from "mongoose";
import { EventSchema } from "src/types/model/bookings";
import { bookingModel } from "./booking.model";
import { seatModel } from "./seat.model";
import paginate from "mongoose-paginate-v2";

const eventSchema = new Schema<EventSchema, Model<EventSchema>>(
  {
    image: {
      type: {
        url: String,
        public_id: String,
      },
    },
    ticket_type: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    time: {
      type: {
        from: Date,
        to: Date,
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    capacity: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  { timestamps: true },
);

eventSchema.plugin(paginate);

const eventModel = model<EventSchema, mongoose.PaginateModel<EventSchema>>("Event", eventSchema);

eventSchema.pre("deleteMany", async function (next) {
  await bookingModel.deleteMany({ event: this });
  await seatModel.deleteMany({ event: this });

  next();
});
export { eventModel };
