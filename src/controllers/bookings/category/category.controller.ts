import mongoose from "mongoose";
import { eventCategory } from "../../../models/index";
import { asyncHandler } from "../../../utils/asyncHandler";
import { ApiError } from "../../../utils/ApiError";
import { ApiResponse } from "../../../utils/ApiResponse";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { CustomRequest } from "../../../types/index";

export const addEventCategory = asyncHandler(async (req: CustomRequest, res: Response) => {
  const { name } = req.body;

  const existingCategory = await eventCategory.findOne({ name });

  if (existingCategory) throw new ApiError(StatusCodes.CONFLICT, "category already exists");

  const newCategory = await eventCategory.create({
    name,
    owner: req.user!._id,
  });

  return new ApiResponse(StatusCodes.CREATED, { newCategory }, "new category added");
});

export const searchForAvailableCategories = asyncHandler(async (req: Request, res: Response) => {
  const availableCategory = await eventCategory.aggregate([
    {
      $match: {},
    },
    {
      $project: {
        name: 1,
      },
    },
  ]);

  return new ApiResponse(StatusCodes.OK, { availableCategory }, "available event category fetched");
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const category = await eventCategory.findById(categoryId);

  if (!category) throw new ApiError(StatusCodes.NOT_FOUND, "category does not exists");

  return new ApiResponse(StatusCodes.OK, { category }, "category fetched");
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const { name } = req.body;

  const category = await eventCategory.findById(categoryId);

  if (!category) throw new ApiError(StatusCodes.NOT_FOUND, "category does not exists");

  const updatedCategory = await eventCategory.findByIdAndUpdate(
    category._id,
    {
      $set: {
        name,
      },
    },
    { new: true },
  );

  return new ApiResponse(StatusCodes.OK, { updatedCategory }, "category updated successfully");
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId } = req.params;

  const category = await eventCategory.findByIdAndDelete(categoryId);

  if (!category) throw new ApiError(StatusCodes.NOT_FOUND, "category does not exists");

  return new ApiResponse(StatusCodes.OK, {}, "category deleted successfully");
});
