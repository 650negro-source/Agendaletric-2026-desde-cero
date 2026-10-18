const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");

const storageDirectory = path.resolve(__dirname, "../../../storage/reportes-tecnicos");
const maxFileSize = 10 * 1024 * 1024;

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getAllowedExtension(file) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    file.mimetype === "image/jpeg" &&
    [".jpg", ".jpeg"].includes(extension)
  ) {
    return ".jpg";
  }
  if (file.mimetype === "video/mp4" && extension === ".mp4") {
    return ".mp4";
  }

  return null;
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDirectory, { recursive: true }, (error) => {
        callback(error, storageDirectory);
      });
    },
    filename(req, file, callback) {
      const extension = getAllowedExtension(file);
      callback(null, `${randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
  fileFilter(req, file, callback) {
    if (!getAllowedExtension(file)) {
      return callback(
        createError("Only JPG and MP4 files are supported", 400)
      );
    }
    callback(null, true);
  },
});

function receiveEvidence(req, res, next) {
  upload.single("archivo")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      error.status = 413;
      error.message = "Each evidence file must be 10 MB or smaller";
    } else if (error instanceof multer.MulterError) {
      error.status = 400;
    }

    next(error);
  });
}

module.exports = {
  storageDirectory,
  receiveEvidence,
};
