import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import * as controllers from "../../controllers/index";

const router = express.Router();

router.use(verifyJWT);

router.route("/?eventId=eventId&seatId=seatId").post(controllers.bookEvent);

router.route("/:bookingId").put(controllers.updateBooking);

// router.route('/');

export { router };
