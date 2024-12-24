import mongoose, { Schema, model, Model } from "mongoose";
import { EventSchema } from "src/types/model/bookings";
import { BookingModel } from "./booking.model";
import { SeatModel } from "./seat.model";
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
      default: 100,
    },
  },
  { timestamps: true }
);

eventSchema.plugin(paginate);

const EventModel = model<EventSchema, mongoose.PaginateModel<EventSchema>>("Event", eventSchema);

eventSchema.pre("deleteMany", async function (next) {
  await BookingModel.deleteMany({ event: this });
  await SeatModel.deleteMany({ eventId: this });

  next();
});
export { EventModel };
