import express from "express";
import * as controllers from "../../controllers/index";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validator.middleware";
import { mongoBodyPathVariables } from "../../validator/params/parame.validator";

const router = express.Router();

router.route("/").post(verifyJWT, controllers.addEventCategory).get(controllers.getAllCategories);

router
  .route("/:categoryId")
  .get(mongoBodyPathVariables("categoryId"), validate, verifyJWT, controllers.getCategoryById)
  .patch(mongoBodyPathVariables("categoryId"), validate, verifyJWT, controllers.updateCategory)
  .delete(mongoBodyPathVariables("categoryId"), validate, verifyJWT, controllers.deleteCategory);

export { router };
