import { param, body } from "express-validator";

export const mongoParamsPathVariables = (mongoId: string) => [
  param(mongoId).notEmpty().isMongoId().withMessage(`invalid ${mongoId} specified`),
];

export const mongoBodyPathVariables = (mongoId: string) => [
  body(mongoId).notEmpty().isMongoId().withMessage(`invalid ${mongoId} specified`),
];
