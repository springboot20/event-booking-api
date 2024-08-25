import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import * as controllers from "../../controllers/index";
import { validate } from "../../middlewares/validator.middleware";
import { mongoBodyPathVariables } from "../../validator/params/parame.validator";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/item/:eventId")
  .post(mongoBodyPathVariables("eventId"), validate, controllers.bookEvent)
  .delete(controllers.removeEventItemFromBooking);

router.route("/").get(mongoBodyPathVariables("eventId"), validate, controllers.getUserBooking);

export { router };
