import express from "express";
import * as controllers from "../../controllers/index";
import { checkUserPermissions, verifyJWT } from "../../middlewares/auth.middleware";
import { ROLE } from "../../types/model/user";
import { validate } from "../../middlewares/validator.middleware";
import {
  mongoBodyPathVariables,
  mongoParamsPathVariables,
} from "../../validator/params/parame.validator";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/book-seat/:eventId")
  .post(mongoParamsPathVariables("eventId"),   validate, controllers.reserveASeat);

router.route("/").get(controllers.getAllAvailableSeats);

router
  .route("/user-seat")
  .get(checkUserPermissions(ROLE.USER, ROLE.ADMIN), controllers.fetchSeatAssociatedWithUser);

export { router };
