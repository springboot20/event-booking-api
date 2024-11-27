import { Request } from 'express';

export interface User {
  _id: string;
  email: string;
  username: string;
  role: string;
}

export interface CustomRequest extends Request {
  user?: User;
}
