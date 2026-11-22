import { ApiError } from "../../utils/ApiError.js";
import multer from "multer";
export const errorHandler = (err, req, res, next) => {
 // Multer errors
  if (err instanceof multer.MulterError) {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;

    return res.status(statusCode).json({
      success: false,
      statusCode,
      message: err.message,
      errors: [],
    });
  }
  // other aplication error 
  const isOperational = err instanceof ApiError;

  const statusCode = isOperational
    ? err.statusCode
    : 500;

  const message = isOperational
    ? err.message
    : "Internal Server Error";

  if (statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: isOperational ? err.errors : [],
    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
};