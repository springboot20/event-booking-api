import { param,query, body } from "express-validator";

export const mongoParamsPathVariables = (mongoId: string) => [
  param(mongoId).notEmpty().isMongoId().withMessage(`invalid ${mongoId} specified`),
];

export const mongoBodyPathVariables = (mongoId: string) => [
  body(mongoId).notEmpty().isMongoId().withMessage(`invalid ${mongoId} specified`),
];

export const mongoQueryPathVariables = (mongoId: string) => [
  query(mongoId).notEmpty().isMongoId().withMessage(`invalid ${mongoId} specified`),
];
