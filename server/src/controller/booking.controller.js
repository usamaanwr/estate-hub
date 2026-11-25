import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asynHandler.js";
import { prisma } from "../dp/index.js";
import { bookingValidation } from "../validator/booking.validator.js";

const createBooking = asyncHandler(async (req, res) => {
  // 1. Validate request body
  const { error, value } = bookingValidation(req.body);

  if (error) {
    throw new ApiError(
      400,
      error.details.map((item) => item.message).join(", ")
    );
  }

  const { propertyId, visitDate, city, message } = value;

  // 2. Check property exists
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  // 3. Only approved and available property can be booked
  if (
    property.approvalStatus !== "approved" ||
    property.status !== "available"
  ) {
    throw new ApiError(
      400,
      "This property is not available for booking"
    );
  }

  // 4. Create booking for logged-in buyer
  const booking = await prisma.booking.create({
    data: {
      propertyId,
      buyerId: req.user.id,
      visitDate: new Date(visitDate),
      city,
      message,
    },
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      booking,
      "Property visit booked successfully"
    )
  );
});

export { createBooking };