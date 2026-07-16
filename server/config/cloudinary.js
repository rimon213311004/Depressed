import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Keep files in memory so we can stream them straight to Cloudinary.
const memory = multer.memoryStorage();

export const upload = multer({
  storage: memory,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB (videos)
});

export const uploadAvatar = multer({
  storage: memory,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Stream a buffer to Cloudinary and resolve with the upload result.
export const uploadToCloudinary = (buffer, { folder, resourceType = "auto" }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

export default cloudinary;
