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
  publicId?: string,
): Promise<UploadApiResponse> => {
  try {
    if (publicId) {
      const paths = publicId?.split("/");

      console.log("paths:", paths);

      const [folderName, filePublicId] = paths;

      // Destroy existing image
      const destroyResponse = await v2.uploader.destroy(`${folderName}/${filePublicId}`);

      if (destroyResponse.result === "not found") {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Public ID not found. Provide a valid publicId.",
        );
      }

      if (destroyResponse.result !== "ok") {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Error while deleting existing file. Try again.",
        );
      }
    }

    return new Promise((resolve, reject) => {
      v2.uploader
        .upload_stream({ resource_type: "auto", folder, public_id: publicId }, (error, result) => {
          if (error) {
            reject(new ApiError(StatusCodes.BAD_REQUEST, error.message));
          } else {
            resolve(result!);
          }
        })
        .end(buffer);
    });
  } catch (error: any) {
    // Wrap errors with ApiError for consistent error handling
    throw error instanceof ApiError
      ? error
      : new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

const deleteFileFromCloudinary = async (
  publicId: string,
  resource_type?: string,
  type?: string,
) => {
  const paths = publicId.split("/");

  console.log("paths:", paths);

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
