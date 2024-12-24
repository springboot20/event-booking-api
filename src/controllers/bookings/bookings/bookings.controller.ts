import { Response } from 'express';
import mongoose from 'mongoose';
import { BookingModel } from '../../../models/bookings/booking.model';
import { EventModel } from '../../../models/bookings/event.model';
import { asyncHandler } from '../../../utils/asyncHandler';
import { ApiError } from '../../../utils/api.error';
import { ApiResponse } from '../../../utils/api.response';
import { StatusCodes } from 'http-status-codes';
import { CustomRequest } from '../../../types/index';
