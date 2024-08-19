import express from "express";
import * as controllers from "../../controllers/index";
import { checkUserPermissions, verifyJWT } from "../../middlewares/auth.middleware";
import { ROLE } from "../../types/model/user";

const router = express.Router();

router.use(verifyJWT);

router.route("/book-seat/:eventId").post(controllers.reserveASeat);

router.route("/book-seats/:eventId").post(controllers.reserveSeats);

router.route("/search-available-seats/:seatId").get(controllers.searchForAvailableSeats);

router.route("/user-seats/:seatId").get(controllers.fetchSeatsAssociatedWithUser);

router
  .route("/seatnumber/add-new-seat")
  .post(checkUserPermissions(ROLE.ADMIN), controllers.addNewSeat);

router.route("/seatnumber").get(controllers.getAllSeatNumbers);

router
  .route("/seatnumber/:id")
  .patch(checkUserPermissions(ROLE.ADMIN), controllers.updateSeatNumber)
  .delete(checkUserPermissions(ROLE.ADMIN), controllers.deleteSeatNumber);

export { router };
