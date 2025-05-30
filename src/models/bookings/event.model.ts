import mongoose, { Schema, model, Model } from "mongoose";
import { EventSchema } from "../../types/model/bookings";
import paginate from "mongoose-paginate-v2";

const eventSchema = new Schema<EventSchema, Model<EventSchema>>(
  {
    image: {
      type: {
        url: String,
        public_id: String,
      },
      default: {
        url: null,
        public_id: null,
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
    seatId:{
      type:Schema.Types.ObjectId,
      ref:"Seat"
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

export { EventModel };
