import express from "express";
import * as controllers from "../../controllers/index";
import { verifyJWT } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validator.middleware";
import {
  userForgotPasswordValidator,
  userLoginValidator,
  userRegistrationValidator,
} from "../../validator/auth/auth.validator";
import { mongoParamsPathVariables } from "../../validator/params/parame.validator";
import { upload } from "../../middlewares/multer.middleware";

const router = express.Router();

/**
 * UNPROTECTED ROUTES
 */

router.route("/register").post(controllers.register);

router.route("/login").post(userLoginValidator(), validate, controllers.login);

router
  .route("/forgot-password")
  .post(userForgotPasswordValidator(), validate, controllers.forgotPassword);

router
  .route("/verify-email/")
  .post(
    controllers.verifyEmail
  );
  router.route("/reset-forgotten-password").post( controllers.resetPassword);

/**
 * PROTECTED ROUTES
 */

router.route("/logout").post(verifyJWT, controllers.logout);

router.route("/resend-email-verification").post(verifyJWT, controllers.resendEmailVerification);

router.route("/change-current-password").put(verifyJWT, controllers.changeCurrentPassword);


router.route("/current-user").get(verifyJWT, controllers.getCurrentUser);
router.route("/refresh-access-token").post(controllers.refreshAccessToken);

router
  .route("/upload-avatar")
  .put(verifyJWT, upload.single("avatar"), controllers.updateUserAvatar);

export { router };
