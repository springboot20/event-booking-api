import { Document, Types } from "mongoose";

export interface EventSchema extends Document {
  title: string;
  description: string;
  price: number;
  owner: Types.ObjectId;
  location: string;
  seatId: Types.ObjectId;
  eventDate: Date;
  capacity: number;
  time: {
    from: Date;
    to: Date;
  };
  category: Types.ObjectId;
}
