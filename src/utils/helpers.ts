import { Request } from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";

const getStaticFilePath = (req: Request, filename: string) =>
  `${req.protocol}://${req.get("host")}/images/${filename}`;
const getLocalFilePath = (filename: string) => `public/images/${filename}`;

const removeLocalFilepath = (localFilepath: string) => {
  fs.unlink(localFilepath, (error) => {
    if (error) {
      console.log(`Error while removing local files: ${error.message}`);
    } else {
      console.log(`Removed local files : ${localFilepath}`);
    }
  });
};

const removeUnusedMulterImageFilesOnError = (req: Request) => {
  try {
    let multerFile = req.file;
    let multerFiles = req.files;

    if (multerFile) {
      removeLocalFilepath(multerFile.path);
    }

    if (multerFiles) {
    }
  } catch (error) {
    console.log(`Error while removing image files : ${error}`);
  }
};

const isPasswordCorrect = async function (enteredPassword: string, password: string) {
  return await bcrypt.compare(enteredPassword, password);
};

const generateTemporaryToken = () => {
  const unHashedToken = crypto.randomBytes(10).toString("hex");

  const salt = bcrypt.genSaltSync(10); // Use synchronous version for hashing
  const hashedToken = bcrypt.hashSync(unHashedToken, salt);

  const tokenExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes from now

  return { unHashedToken, hashedToken, tokenExpiry };
};

export {
  getStaticFilePath,
  getLocalFilePath,
  removeLocalFilepath,
  removeUnusedMulterImageFilesOnError,
  isPasswordCorrect,
  generateTemporaryToken,
};

interface AggregateInterface {
  limit: number;
  page: number;
  customLabels: mongoose.CustomLabels;
}

export const aggreagetPaginate = ({
  limit = 10,
  page = 1,
  ...customLabels
}: AggregateInterface): mongoose.PaginateOptions => {
  return {
    page: Math.max(page, 1),
    limit: Math.max(limit, 1),
    customLabels: {
      pagingCounter: "serialNumberStartFrom",
      ...customLabels,
    },
  };
};
