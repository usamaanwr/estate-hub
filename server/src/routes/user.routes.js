import { Router } from "express";

import jwt from "jsonwebtoken"
import { forgotPassword, loginUser, logoutUser, refreshAccessToken, registerUser, resendOtp, resetPassword } from "../controller/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/asynHandler.js";

const router = Router();

router.route("/register").post( registerUser)
router.route("/login").post( loginUser)
router.route("/logOut").post( verifyJWT, logoutUser )
router.route("/refresh-token").post(refreshAccessToken)
router.route("/forgot-password").post( forgotPassword)
router.route("/resend-otp").post( resendOtp)
router.route("/reset-password").post( resetPassword)

export default router