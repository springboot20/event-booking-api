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

router.route("/register").post(userRegistrationValidator(), validate, controllers.register);

router.route("/login").post(userLoginValidator(), validate, controllers.login);

router
  .route("/forgot-password/")
  .post(userForgotPasswordValidator(), validate, controllers.forgotPassword);

router.route("/send-email/").post(controllers.sendEmail);

router
  .route("/verify-email/:id/:token")
  .post(
    mongoParamsPathVariables("id"),
    mongoParamsPathVariables("token"),
    validate,
    controllers.verifyEmail,
  );

/**
 * PROTECTED ROUTES
 */

router.route("/logout").post(verifyJWT, controllers.logout);

router.route("/resend-email-verification").post(verifyJWT, controllers.resendEmailVerification);

router.route("/change-current-password").post(verifyJWT, controllers.changeCurrentPassword);

router
  .route("/reset-forgotten-password/:resetToken")
  .post(mongoParamsPathVariables("resetToken"), validate, verifyJWT, controllers.resetPassword);

router.route("/current-user").get(verifyJWT, controllers.getCurrentUser);

router
  .route("/upload-avatar")
  .post(verifyJWT, upload.single("avatar"), controllers.updateUserAvatar);

export { router };
