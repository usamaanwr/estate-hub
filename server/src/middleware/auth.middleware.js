import { asyncHandler } from "../../utils/asynHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../../utils/ApiError.js";
import { prisma } from "../dp/index.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }
  const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decodedToken?._id },
    omit: { password: true, refreshToken: true },
  });
  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }
  req.user = user;
  next();
});
