import { Document } from "mongoose";

export interface UserSchema extends Document {
  email: string;
  username: string;
  password: string;
  role: string;
  refreshToken: string;
  isEmailVerified: boolean;
  emailVerificationToken: string | undefined;
  emailVerificationExpiry: Date | undefined;
  forgotPasswordToken: string | undefined;
  forgotPasswordExpiry: Date | undefined;
  loginType: string;
  isAuthenticated: boolean;
  avatar: {
    type: {
      url: string;
      localPath: string;
    };
  };
}

export enum ROLE {
  ADMIN = "ADMIN",
  USER = "USER",
  SUB_ADMIN = "SUB_ADMIN",
}
