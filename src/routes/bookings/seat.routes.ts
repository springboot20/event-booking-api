import express from "express";
import * as controllers from "../../controllers/index";
import { checkUserPermissions, verifyJWT } from "../../middlewares/auth.middleware";
import { ROLE } from "../../types/model/user";
import { validate } from "../../middlewares/validator.middleware";
import { mongoBodyPathVariables } from "../../validator/params/parame.validator";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/book-seat/:eventId")
  .post(mongoBodyPathVariables("eventId"), validate, controllers.reserveASeat);

router
  .route("/:eventId")
  .get(mongoBodyPathVariables("eventId"), validate, controllers.getAllAvailableSeats);

router
  .route("/user-seat/:seatId")
  .get(
    mongoBodyPathVariables("seatId"),
    validate,
    checkUserPermissions(ROLE.USER),
    controllers.fetchSeatAssociatedWithUser
  );

export { router };
