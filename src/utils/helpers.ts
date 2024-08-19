import { Request } from "express";
import fs from "fs";
import bcrypt from "bcrypt";
import crypto from "crypto";

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

const generateTemporaryToken = async function () {
  const unHashedToken = crypto.randomBytes(10).toString("hex");

  const salt = await bcrypt.genSalt(20);

  const hashedToken = await bcrypt.hash(unHashedToken, salt);
  const tokenExpiry = Date.now() + 5 * 60 * 1000;

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
