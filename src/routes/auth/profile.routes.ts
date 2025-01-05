import express from "express";
import * as controllers from "../../controllers/index";
import { verifyJWT } from "../../middlewares/auth.middleware";

const router = express.Router();

router.use(verifyJWT);

router.route("/").patch(controllers.updateUserProfile).get(controllers.getUserProfile);

export { router };
