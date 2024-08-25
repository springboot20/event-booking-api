import express from "express";
import * as controllers from "../../controllers/index";
import { checkUserPermissions, verifyJWT } from "../../middlewares/auth.middleware";
import { ROLE } from "../../types/model/user";
import { validate } from "../../middlewares/validator.middleware";
import { mongoBodyPathVariables } from "../../validator/params/parame.validator";

const router = express.Router();

router
  .route("/")
  .get(controllers.getAllEvents)
  .post(verifyJWT, checkUserPermissions(ROLE.ADMIN, ROLE.SUB_ADMIN), controllers.createEvent);

router
  .route("/category/:categoryId")
  .get(mongoBodyPathVariables("categoryId"), validate, verifyJWT, controllers.getEventsByCategory);

router
  .route("/:eventId")
  .get(mongoBodyPathVariables("eventId"), validate, controllers.getEventById)
  .patch(mongoBodyPathVariables("eventId"), validate, verifyJWT, controllers.updateEvent)
  .delete(mongoBodyPathVariables("eventId"), validate, verifyJWT, controllers.deleteEvent);

router.route("/available-events/").post(controllers.searchForAvailableEvents);

export { router };
