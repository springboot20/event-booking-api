import express from 'express';
import * as controllers from '../../controllers/index';
import { checkUserPermissions, verifyJWT } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validator.middleware';
import { mongoParamsPathVariables } from '../../validator/params/parame.validator';
import { ROLE } from '../../types/model/user';

const router = express.Router();

router
  .route('/')
  .post(
    verifyJWT,
    controllers.addEventCategoryModel,
    checkUserPermissions(ROLE.ADMIN, ROLE.SUB_ADMIN)
  )
  .get(controllers.getAllCategories);

router
  .route('/:categoryId')
  .get(mongoParamsPathVariables('categoryId'), validate, verifyJWT, controllers.getCategoryById)
  .patch(mongoParamsPathVariables('categoryId'), validate, verifyJWT, controllers.updateCategory)
  .delete(mongoParamsPathVariables('categoryId'), validate, verifyJWT, controllers.deleteCategory);

export { router };
