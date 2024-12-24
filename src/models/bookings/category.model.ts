import { Schema, model } from 'mongoose';

const EventCategoryModelSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const EventCategoryModel = model('Category', EventCategoryModelSchema);
