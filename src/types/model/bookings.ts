import { Document, Types } from "mongoose";

export interface EventSchema extends Document {
  image: {
    url: string | null;
    public_id: string | null;
  };
  title: string;
  description: string;
  price: number;
  owner: Types.ObjectId;
  location: string;
  seatId: Types.ObjectId;
  eventDate: Date;
  capacity: number;
  featured: boolean;
  ticket_type: string;
  time: {
    from: Date;
    to: Date;
  };
  category: Types.ObjectId;
}

