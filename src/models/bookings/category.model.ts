import { Schema, model } from "mongoose";

const eventCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const eventCategory = model("Category", eventCategorySchema);
