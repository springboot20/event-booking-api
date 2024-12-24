import { Document, Types } from "mongoose";

export interface EventSchema extends Document {
  image: {
    url: string;
    public_id: string;
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

export interface BookmarkSchema extends Document {
  markedBy: Types.ObjectId;
  bookmarkItems: [
    {
      event: Types.ObjectId;
      ticket: number;
    },
  ];
}
