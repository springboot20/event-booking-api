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

router.route("/").get(controllers.getAllSeats);

router
  .route("/book-seats/:eventId")
  .post(mongoBodyPathVariables("eventId"), validate, controllers.reserveSeats);

router
  .route("/user-seats/:seatId")
  .get(mongoBodyPathVariables("seatId"), validate, controllers.fetchSeatsAssociatedWithUser);

router
  .route("/seat-numbers/add-new-seat-number")
  .post(checkUserPermissions(ROLE.ADMIN), controllers.addNewSeat);

router.route("/seat-numbers").get(controllers.getAllSeatNumbers);

router
  .route("/seat-numbers/:id")
  .patch(
    mongoBodyPathVariables("id"),
    validate,
    checkUserPermissions(ROLE.ADMIN),
    controllers.updateSeatNumber,
  )
  .delete(
    mongoBodyPathVariables("id"),
    validate,
    checkUserPermissions(ROLE.ADMIN),
    controllers.deleteSeatNumber,
  );

export { router };
