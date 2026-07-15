import { v2 as cloudinary } from "cloudinary";

// Cloudinary 설정을 한 곳에서만 한다. routes.ts(업로드)와 materials 라우터(삭제)가 공유한다.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
