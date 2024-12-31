import express from "express";
import { verifyJWT } from "../../middlewares/auth.middleware";
import * as controllers from "../../controllers/index";
import { validate } from "../../middlewares/validator.middleware";
import { mongoParamsPathVariables } from "../../validator/params/parame.validator";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/:eventId")
  .post(mongoParamsPathVariables("eventId"), validate, controllers.addEventToBookmark)
  .delete(mongoParamsPathVariables("eventId"), validate, controllers.removeEventFromBookmark);

router.route("/").get(controllers.getUserBookmark).patch(controllers.clearBookmark);

export { router };
