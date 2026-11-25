import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authorizeRole } from "../middleware/authorizeRoles.middleware.js";
import { createBooking } from "../controller/booking.controller.js";

const BookingRouter = Router();

BookingRouter.post(
  "/",
  verifyJWT,
  authorizeRole("buyer"),
  createBooking
);

export default BookingRouter;