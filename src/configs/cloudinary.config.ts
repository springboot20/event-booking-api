import { UploadApiResponse, v2 } from "cloudinary";
import { ApiError } from "../utils/api.error";
import dotenv from "dotenv";
import { StatusCodes } from "http-status-codes";

dotenv.config();

v2.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  cloud_name: process.env.CLOUDINARY_NAME,
});

const uploadFileToCloudinary = async (
  buffer: Buffer,
  folder: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    v2.uploader
      .upload_stream({ resource_type: "auto", folder }, (error, result) => {
        if (error) {
          reject(new ApiError(StatusCodes.BAD_REQUEST, error.message));
        } else {
          resolve(result!);
        }
      })
      .end(buffer);
  });
};

const deleteFileFromCloudinary = async (
  publicId: string,
  resource_type?: string,
  type?: string,
) => {
  const paths = publicId.split("/");

  const folderName = paths[0];
  const public_id = paths[1];

  return new Promise((resolve, reject) => {
    v2.uploader.destroy(
      `${folderName}/${public_id}`,
      {
        resource_type,
        type,
      },
      (error, result) => {
        if (error) {
          reject(new ApiError(StatusCodes.BAD_REQUEST, error.message));
        } else {
          resolve(result);
        }
      },
    );
  });
};

export { uploadFileToCloudinary, deleteFileFromCloudinary };
