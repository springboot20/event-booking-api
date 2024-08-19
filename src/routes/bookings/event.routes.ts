import express from "express";
import * as controllers from "../../controllers/index";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = express.Router();

router.route("/").post(verifyJWT, controllers.createEvent).get(controllers.getAllEvents);

router.route("/user-events").get(verifyJWT, controllers.fetchEventsAssociatedWithUser);

router.route("/category/:categoryId").get(verifyJWT, controllers.getEventByCategory);

router
  .route("/:eventId")
  .get(controllers.searchForAvailableEvents)
  .patch(verifyJWT, controllers.updateEvent)
  .delete(verifyJWT, controllers.deleteEvent);

router.route("/available-events/:eventId").get(controllers.searchForAvailableEvents);

export { router };
