import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asynHandler.js";
import { prisma } from "../dp/index.js";

const getPendingProperties = asyncHandler(async (req, res) => {
  const properties = await prisma.property.findMany({
    where: {
      approvalStatus: "pending",
    },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        properties,
        "pending properties fetched successFully"
      )
    );
});

const approvalProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await prisma.property.findUnique({
    where: { id },
  });
  if (!property) {
    throw new ApiError(404, "Property not found");
  }
  if (property.approvalStatus !== "pending") {
    throw new ApiError(400, "Property is not pending");
  }
  const updateProperty = await prisma.property.update({
    where:{ id },
    data:{
        approvalStatus: "approved",
    },
  })
 return res.status(200).json(
    new ApiResponse(
      200,
      updateProperty,
      "Property approved successfully"
    )
  );
});
export { getPendingProperties  , approvalProperty};
