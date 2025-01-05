import { Schema, model, Error, Model } from "mongoose";
import bcrypt from "bcrypt";
import { AvailableSocialLogin, UserLoginType } from "../../constants/constants";
import { ROLE, UserSchema } from "../../types/model/user";
import { BookmarkModel } from "../bookings/bookmark.model";
import { ProfileModel } from "./profile.model";

const userSchema = new Schema<UserSchema, Model<UserSchema>>({
  avatar: {
    type: {
      url: String,
      public_id: String,
    },
    default: { url: null, public_id: null }, // Ensure the default is an object
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ROLE,
    default: ROLE.USER,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isAuthenticated: { type: Boolean, default: false },
  refreshToken: { type: String },
  emailVerificationToken: { type: String },
  emailVerificationExpiry: { types: Date },
  forgotPasswordToken: { type: String },
  forgotPasswordExpiry: { type: Date },
  loginType: {
    type: String,
    enum: AvailableSocialLogin,
    default: UserLoginType.EMAIL_PASSWORD,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    if (error instanceof Error) {
      next(error);
    }
  }
});

userSchema.post("save", async function (user, next) {
  try {
    await BookmarkModel.findOneAndUpdate(
      { markedBy: user._id },
      {
        $setOnInsert: {
          bookmarkItems: [],
        },
      },
      { upsert: true, new: true }
    );

    await ProfileModel.findOneAndUpdate(
      {
        user: user?._id,
      },
      {
        $setOnInsert: {
          user: user?._id,
        },
      },
      { upsert: true, new: true }
    );

    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePasswords = function (enteredPassword: string) {
  return bcrypt.compareSync(enteredPassword, this.password);
};

const UserModel = model<UserSchema>("User", userSchema);
export { UserModel };
