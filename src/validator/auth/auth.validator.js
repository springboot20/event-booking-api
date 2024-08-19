const validator = require('express-validator');
const { body } = validator;

const userRegistrationValidator = () => {
  return [
    body("username").isString()
  ];
};
