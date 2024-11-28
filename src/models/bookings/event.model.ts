import { Schema, model } from "mongoose";
import paginate from "mongoose-paginate-v2";

const bookmarkSchema = new Schema(
  {
    markBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    events: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Event",
        },
      ],
    },
  },
  { timestamps: true },
);

bookmarkSchema.plugin(paginate);

const eventModel = model("Bookmark", bookmarkSchema);

export { eventModel };
