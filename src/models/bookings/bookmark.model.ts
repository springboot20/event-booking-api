import { Schema, model } from "mongoose";
import paginate from "mongoose-paginate-v2";

const bookmarkSchema = new Schema(
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
            type: [Schema.Types.ObjectId],
          },
        },
      ],
    },
  },
  { timestamps: true }
);

bookmarkSchema.plugin(paginate);

const BookmarkModel = model("Bookmark", bookmarkSchema);

export { BookmarkModel };
