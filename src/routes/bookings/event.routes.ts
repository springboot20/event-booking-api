import express from "express";
import * as controllers from "../../controllers/index";
import { checkUserPermissions, verifyJWT } from "../../middlewares/auth.middleware";
import { ROLE } from "../../types/model/user";
import { validate } from "../../middlewares/validator.middleware";
import { mongoParamsPathVariables } from "../../validator/params/parame.validator";
import { upload } from "../../middlewares/multer.middleware";

const router = express.Router();

router
  .route("/")
  .get(controllers.getAllEvents)
  .post(
    verifyJWT,
    upload.single("image"),
    checkUserPermissions(ROLE.ADMIN, ROLE.SUB_ADMIN),
    controllers.createEvent,
  );

router
  .route("/category/:categoryId")
  .get(
    mongoParamsPathVariables("categoryId"),
    validate,
    verifyJWT,
    controllers.getEventsByCategory,
  );

router
  .route("/:eventId")
  .get(mongoParamsPathVariables("eventId"), validate, controllers.getEventById)
  .patch(mongoParamsPathVariables("eventId"), validate, verifyJWT, controllers.updateEvent)
  .delete(mongoParamsPathVariables("eventId"), validate, verifyJWT, controllers.deleteEvent);

router.route("/available-events/").post(controllers.searchForAvailableEvents);

export { router };
