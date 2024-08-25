import multer from "multer";

const storage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, "./public/images");
  },
  filename: (request, file, callback) => {
    let fileExtension = "";
    if (file.originalname.split(".").length > 0) {
      fileExtension = file.originalname.substring(file.originalname.lastIndexOf("."));
    }

    const filenameWithoutExtension = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-")
      ?.split(".")[0];

    callback(
      null,
      `${filenameWithoutExtension}${Date.now()}${Math.ceil(Math.random() * 1e6)}.${fileExtension}`,
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1000 * 1000,
  },
});

export { upload };
