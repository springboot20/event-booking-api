import { Schema, model } from "mongoose";

const ProfileSchema = new Schema(
  {
    firstname: {
      type: String,
      default: "John",
      trim: true,
    },
    lastname: {
      type: String,
      default: "Doe",
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const ProfileModel = model("Profile", ProfileSchema);
