import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asynHandler.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { prisma } from "../dp/index.js";
const addProperty = asyncHandler(async (req, res) => {
  // check seller role

  if (req.user.role !== "seller") {
    throw new ApiError(403, "Only sellers can add properties");
  }

  //check seller approval

  if (!req.user.isApproved) {
    throw new ApiError(403, "Your seller account is not approved yet");
  }
  const {
    title,
    description,
    price,
    city,
    location,
    type,
    bedroom,
    bathroom,
    area,
    areaUnit,
  } = req.body;
  // console.log(propertyfields);

  // feild vaidation
  if (
    !title?.trim() ||
    !description?.trim() ||
    !price ||
    !city?.trim() ||
    !location?.trim() ||
    !type ||
    !area
  ) {
    throw new ApiError(400, "All required fields must be filled");
  }

  // Number validation
  const propertyPrice = Number(price);
  const propertyArea = Number(area);

  if (
    !Number.isFinite(propertyPrice) ||
    propertyPrice <= 0 ||
    !Number.isFinite(propertyArea) ||
    propertyArea <= 0
  ) {
    throw new ApiError(400, "Price and area must be valid positive numbers");
  }

  const bedroomCount = bedroom ? Number(bedroom) : 0;
  const bathroomCount = bathroom ? Number(bathroom) : 0;

  if (
    !Number.isInteger(bedroomCount) ||
    bedroomCount < 0 ||
    !Number.isInteger(bathroomCount) ||
    bathroomCount < 0
  ) {
    throw new ApiError(400, "Bedroom and bathroom must be valid numbers");
  }

  //imaege check
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, "At least one property image is required");
  }
  // upload images for cloudinary

  const uploadPromise = req.files.map((file) => {
    return uploadOnCloudinary(file.buffer, "estatehub-properties");
  });
  const uploadResults = await Promise.all(uploadPromise);

  const imagesUrls = uploadResults.map((result) => result.secure_url);

  const property = await prisma.property.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      price: propertyPrice,
      city: city.trim(),
      location: location.trim(),
      type,
      bedroom: bedroomCount,
      bathroom: bathroomCount,
      area: propertyPrice,
      areaUnit: areaUnit || "sqft",
      images: imagesUrls,
      //Authenticated seller

      sellerId: req.user.id,
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, property, "Property added successfully"));
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

// get all property

const getAllProperty = asyncHandler(async (req, res) => {
  const properties = await prisma.property.findMany({
    where: {
      approvalStatus: "approved",
      status: "available",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, properties, "All properties fetched successfully")
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
export { addProperty, getMyProperties, getAllProperty , getPropertiesById };
