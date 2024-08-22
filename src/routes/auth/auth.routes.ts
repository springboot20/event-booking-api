import express from "express";
import * as controllers from "../../controllers/index";
import { verifyJWT } from "../../middlewares/auth.middleware";
// import { upload } from "../../middlewares/multer.middleware";

const router = express.Router();

/**
 * UNPROTECTED ROUTES
 */

router.route("/register").post(controllers.register);

router.route("/login").post(controllers.login);

router.route("/forgot-password/").post(controllers.forgotPassword);

router.route("/send-email/").post(controllers.sendEmail);

router.route("/verify-email/:id/:token").post(controllers.verifyEmail);

router.route("/reset-password/:resetToken").post(controllers.resetPassword);

/**
 * PROTECTED ROUTES
 */

router.route("/logout").post(verifyJWT, controllers.logout);

router.route("/resend-email-verification").post(verifyJWT, controllers.resendEmailVerification);

router.route("/change-current-password").post(verifyJWT, controllers.changeCurrentPassword);

router.route("/reset-forgotten-password/:resetToken").post(verifyJWT, controllers.resetPassword);

router.route("/current-user").get(verifyJWT, controllers.getCurrentUser);

// router
//   .route("/upload-avatar")
//   .post(verifyJWT, upload.single("avatar"), controllers.updateUserAvatar);

export { router };
