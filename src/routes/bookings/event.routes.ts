import express from "express";
import * as controllers from "../../controllers/index";
import { checkUserPermissions, verifyJWT } from "../../middlewares/auth.middleware";
import { ROLE } from "../../types/model/user";

const router = express.Router();

router
  .route("/")
  .get(controllers.getAllEvents)
  .post(verifyJWT, checkUserPermissions(ROLE.ADMIN, ROLE.SUB_ADMIN), controllers.createEvent);

router.route("/category/:categoryId").get(verifyJWT, controllers.getEventsByCategory);

router
  .route("/:eventId")
  .get(controllers.getEventById)
  .patch(verifyJWT, controllers.updateEvent)
  .delete(verifyJWT, controllers.deleteEvent);

router.route("/available-events/").post(controllers.searchForAvailableEvents);

export { router };
