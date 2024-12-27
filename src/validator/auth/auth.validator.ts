import { body } from "express-validator";
import { ROLE } from "../../types/model/user";

const passwordReg = /^(?=.*[a-z])(?=.*\d)(?=.*[-.+@_&])(?=.*[A-Z]*).{6,}$/;

const userRegistrationValidator = () => {
  return [
    body("username").trim().isString().notEmpty().withMessage("username is required"),
    body("email")
      .trim()
      .isString()
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("invalid email format entered"),
    body("password").trim().isString().notEmpty().withMessage("password is required"),
    body("role")
      .optional()
      .isIn([ROLE.ADMIN, ROLE.SUB_ADMIN, ROLE.USER])
      .withMessage("invalid user role"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email")
      .trim()
      .isString()
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("invalid email format entered"),
    body("password").trim().isString().notEmpty().withMessage("password is required"),
    // .matches(passwordReg)
    // .withMessage(
    //   "password must be at least 6 long in length and it is expected to contain digits, letter",
    // ),
  ];
};

const userForgotPasswordValidator = () => {
  return [
    body("email")
      .trim()
      .isString()
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("invalid email format entered"),
  ];
};

export { userRegistrationValidator, userLoginValidator, userForgotPasswordValidator };
