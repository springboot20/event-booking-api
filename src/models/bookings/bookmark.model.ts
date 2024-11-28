import mongoose, { Schema, model, Model } from "mongoose";
import { EventSchema } from "src/types/model/bookings";
import { bookingModel } from "./booking.model";
import { seatModel } from "./seat.model";
import paginate from "mongoose-paginate-v2";