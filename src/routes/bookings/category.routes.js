import express from "express";
import * as controllers from "../../controllers/index";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = express.Router();

router
  .route("/")
  .post(verifyJWT, controllers.addEventCategory)
  .get(controllers.searchForAvailableCategories);

router
  .route("/:categoryId")
  .get(verifyJWT, controllers.getCategoryById)
  .patch(verifyJWT, controllers.updateCategory)
  .delete(verifyJWT, controllers.deleteCategory);

export { router };
