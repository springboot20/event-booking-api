import { Schema, model, Model } from "mongoose";
import paginate from "mongoose-paginate-v2";
import { BookmarkSchema } from "src/types/model/bookings";

const bookmarkSchema = new Schema<BookmarkSchema, Model<BookmarkSchema>>(
  {
    markBy: {
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
          ticket: {
            type: Number,
            required: true,
            min: [1, "ticket must not less than 1"],
            default: 1,
          },
        },
      ],
    },
  },
  { timestamps: true },
);

bookmarkSchema.plugin(paginate);

const bookmarkModel = model<BookmarkSchema>("Bookmark", bookmarkSchema);

export { bookmarkModel };
