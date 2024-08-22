import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import * as controllers from "../../controllers/index";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/item/:eventId")
  .post(controllers.bookEvent)
  .delete(controllers.removeEventItemFromBooking);

router.route("/").get(controllers.getUserBooking);

export { router };
