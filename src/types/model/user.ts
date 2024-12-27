import { Document } from "mongoose";

export interface UserSchema extends Document {
  email: string;
  username: string;
  password: string;
  role: string;
  refreshToken: string;
  isEmailVerified: boolean;
  emailVerificationToken: string | undefined;
  emailVerificationExpiry: Date | number |  undefined;
  forgotPasswordToken: string | undefined;
  forgotPasswordExpiry: Date | number |  undefined;
  loginType: string;
  isAuthenticated: boolean;
  avatar: {
    url: string | null;
    public_id: string | null;
  };
}

export enum ROLE {
  ADMIN = "ADMIN",
  USER = "USER",
  SUB_ADMIN = "SUB_ADMIN",
}
