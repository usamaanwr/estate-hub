import { ApiError } from "../../utils/ApiError.js";

export const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized request");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "you are not authoried to perform this action");
    }
    next();
  };
};
