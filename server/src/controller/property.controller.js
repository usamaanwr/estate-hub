import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { validateProperty } from "../validator/property.validator.js";
import { validatePropertyUpdate } from "../validator/property.validator.js";
import { asyncHandler } from "../../utils/asynHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../../utils/cloudinary.js";
import { prisma } from "../dp/index.js";
import { fileTypeFromBuffer } from "file-type";
const addProperty = asyncHandler(async (req, res) => {
  // 1. Seller authorization
  if (req.user.role !== "seller") {
    throw new ApiError(403, "Only sellers can add properties");
  }

  if (req.user.role !== "seller") {
    throw new ApiError(403, "Only sellers can add properties");
  }

  // 2. Validate property fields
  const { error, value } = validateProperty(req.body);

  if (error) {
    throw new ApiError(
      400,
      error.details.map((item) => item.message).join(", ")
    );
  }

  // 3. Image count validation
  const files = req.files ?? [];

  if (files.length === 0 || files.length > 5) {
    throw new ApiError(400, "Please upload between 1 and 5 property images");
  }

  // 4. Validate actual image file types
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  for (const file of files) {
    const detectedType = await fileTypeFromBuffer(file.buffer);

    if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
      throw new ApiError(
        400,
        "Invalid image. Only JPEG, PNG and WebP are allowed"
      );
    }
  }

  // 5. Upload images to Cloudinary
  const uploadedImages = [];

  try {
    for (const file of files) {
      const result = await uploadOnCloudinary(
        file.buffer,
        "estatehub-properties"
      );

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    // 6. Save property in PostgreSQL
    const property = await prisma.property.create({
      data: {
        title: value.title,
        description: value.description,
        price: value.price,
        city: value.city,
        location: value.location,
        type: value.type,
        bedroom: value.bedroom,
        bathroom: value.bathroom,
        area: value.area,
        areaUnit: value.areaUnit,

        images: uploadedImages.map((image) => image.url),

        sellerId: req.user.id,
        approvalStatus: "pending",
        status: "available",
      },
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, property, "Property submitted for admin approval")
      );
  } catch (error) {
    // 7. Cleanup previously uploaded images
    const cleanupResults = await Promise.allSettled(
      uploadedImages.map((image) => deleteFromCloudinary(image.publicId))
    );

    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Cloudinary cleanup failed:", result.reason);
      }
    });

    console.error("Property creation failed:", error);

    throw new ApiError(500, "Failed to create property");
  }
});
// get my porperty
const getMyProperties = asyncHandler(async (req, res) => {
  if (req.user.role !== "seller") {
    throw new ApiError(403, "Only sellers can view their properties");
  }

  const properties = await prisma.property.findMany({
    where: {
      sellerId: req.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, properties, "Your properties fetched successfully")
    );
});

// get edit by property for seller use

const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Find Property
  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  // 2. Check Ownership
  if (property.sellerId !== req.user.id) {
    throw new ApiError(403, "You cannot update another seller's property");
  }

  // 3. Validate Fields
  const { error, value } = validatePropertyUpdate(req.body);

  if (error) {
    throw new ApiError(
      400,
      error.details.map((item) => item.message).join(", ")
    );
  }

  const files = req.files ?? [];

  let updatedImages;

  if (files.length > 0) {
    const uploaded = await Promise.all(
      files.map((file) =>
        uploadOnCloudinary(file.buffer, "estatehub-properties")
      )
    );

    updatedImages = uploaded.map((image) => image.secure_url);
  }

  // 5. Update Property in Database
  const updatedProperty = await prisma.property.update({
    where: { id, sellerId: req.user.id },
    data: {
      ...value,
      ...(updatedImages !== undefined && {
        images: updatedImages,
      }),
      approvalStatus: "pending",
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedProperty,
      "Property updated successfully"
    )
  );
});

// delete properties 
const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find property
  const property = await prisma.property.findUnique({
    where: { id },
  });

  if (!property) {
    throw new ApiError(404, "Property not found");
  }

  // Check ownership
  if (property.sellerId !== req.user.id) {
    throw new ApiError(
      403,
      "You cannot delete another seller's property"
    );
  }

  // Delete property
  await prisma.property.delete({
    where: {
      id,
      sellerId: req.user.id,
    },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Property deleted successfully"
    )
  );
});

const getPropertiesById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const property = await prisma.property.findFirst({
    where: {
      id,
      approvalStatus: "approved",
    },
  });

  if (!property) {
    throw new ApiError(404, "Property not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, property, "Property fetched successfully"));
});
export { addProperty, getMyProperties, updateProperty, deleteProperty,  getPropertiesById };
