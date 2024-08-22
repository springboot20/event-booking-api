import express from "express";
import * as controllers from "../../controllers/index";
import { checkUserPermissions, verifyJWT } from "../../middlewares/auth.middleware";
import { ROLE } from "../../types/model/user";

const router = express.Router();

router.use(verifyJWT);

router.route("/book-seat/:eventId").post(controllers.reserveASeat);

router.route("/").get(controllers.getAllSeats);

router.route("/book-seats/:eventId").post(controllers.reserveSeats);

router.route("/user-seats/:seatId").get(controllers.fetchSeatsAssociatedWithUser);

router
  .route("/seat-numbers/add-new-seat-number")
  .post(checkUserPermissions(ROLE.ADMIN), controllers.addNewSeat);

router.route("/seat-numbers").get(controllers.getAllSeatNumbers);

router
  .route("/seat-numbers/:id")
  .patch(checkUserPermissions(ROLE.ADMIN), controllers.updateSeatNumber)
  .delete(checkUserPermissions(ROLE.ADMIN), controllers.deleteSeatNumber);

export { router };
