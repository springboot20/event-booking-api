import { Schema, model, Model } from "mongoose";
import paginate from "mongoose-paginate-v2";
import { BookmarkSchema } from "../../types/model/bookings";

const bookmarkSchema = new Schema<BookmarkSchema, Model<BookmarkSchema>>(
  {
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    bookmarkItems: {
      type: [
        {
          event: {
            type: Schema.Types.ObjectId,
            ref: "Event",
          },
          seats: {
            types: [Schema.Types.ObjectId],
            default: [],
          },
        },
      ],
    },
  },
  { timestamps: true }
);

bookmarkSchema.plugin(paginate);

const BookmarkModel = model<BookmarkSchema>("Bookmark", bookmarkSchema);

export { BookmarkModel };
