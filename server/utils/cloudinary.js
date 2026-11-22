import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier"
import dotenv from "dotenv";
dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = (fileBuffer, foldername) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: foldername,
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result?.secure_url || !result?.public_id) {
          return reject(new Error("Cloudinary upload failed"));
        }

        resolve(result);
      }
    );

    streamifier
      .createReadStream(fileBuffer)
      .on("error", reject)
      .pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

}
