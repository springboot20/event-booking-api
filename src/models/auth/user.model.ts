import { bookingModel } from "./../bookings/booking.model";
import { Schema, model, Error, Model } from "mongoose";
import bcrypt from "bcrypt";
import { AvailableSocialLogin, UserLoginType } from "../../constants/constants";
import { ROLE, UserSchema } from "../../types/model/user";
import { seatModel } from "../bookings/seat.model";
import { bookmarkModel } from "../bookings/bookmark.model";

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
  const userBookmark = await bookmarkModel.findOne({ markBy: user._id });
  const userSeat = await seatModel.findOne({ reservedBy: user._id });

  if (!userBookmark) {
    await bookmarkModel.create({
      markBy: user._id,
      bookmarkItems: [],
    });
  }

  if (!userSeat) {
    await seatModel.create({
      reservedBy: user._id,
    });
  }

  next();
});

userSchema.methods.comparePasswords = function (enteredPassword: string) {
  return bcrypt.compareSync(enteredPassword, this.password);
};

const userModel = model<UserSchema>("User", userSchema);
export { userModel };
