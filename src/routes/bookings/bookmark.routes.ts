import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import * as controllers from "../../controllers/index";
import { validate } from "../../middlewares/validator.middleware";
import { mongoParamPathVariables } from "../../validator/params/parame.validator";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/:eventId")
  .post(mongoParamPathVariables("eventId"), validate,controllers.addEventToBookmark)
  .delete(mongoParamPathVariables("eventId"), validate, controllers.removeEventFromBookmark);

router.route("/").get(controllers.getUserBookmark).patch(controllers.clearBookmark);

export { router };
