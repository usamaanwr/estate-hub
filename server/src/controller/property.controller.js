import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asynHandler.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";
import { prisma } from "../dp/index.js";
const addProperty = asyncHandler(async (req, res) => {
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
  console.log(propertyfields);
  
  // feild vaidation
 if (!title || !description || !price || !city || !location || !type || !area) {
  throw new ApiError(400, "All required fields must be filled");
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
      title,
      description,
      price: parseFloat(price),
      city,
      location,
      type,
      bedroom: bedroom ? parseInt(bedroom) : 0,
      bathroom: bathroom ? parseInt(bathroom) : 0,
      area: parseFloat(area),
      areaUnit: areaUnit || "sqft",
      images: imagesUrls,
      sellerId: req.user.id, 
    },
  });

  return res
    .status(201)
    .json(new ApiResponse(201, property, "Property added successfully"));
});

export { addProperty}