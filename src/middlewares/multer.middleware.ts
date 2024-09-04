import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1000 * 1000,
  },
});

export { upload };
