import express from "express";
import * as controllers from "../../controllers/index";
import { checkUserPermissions, verifyJWT } from "../../middlewares/auth.middleware";
import { ROLE } from "../../types/model/user";
import { validate } from "../../middlewares/validator.middleware";
import {
  mongoBodyPathVariables,
  mongoParamsPathVariables,
  mongoQueryPathVariables,
} from "../../validator/params/parame.validator";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/book-seat/:eventId")
  .post(
    mongoParamsPathVariables("eventId"),
    mongoBodyPathVariables("seat"),
    validate,
    controllers.reserveASeat
  );

router.route("/").get(controllers.getAllAvailableSeats);

router
  .route("/user-seat/:seatId")
  .get(
    mongoBodyPathVariables("seatId"),
    validate,
    checkUserPermissions(ROLE.USER),
    controllers.fetchSeatAssociatedWithUser
  );

export { router };
