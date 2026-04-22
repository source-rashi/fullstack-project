import app from "./app.js";
import cloudinary from "cloudinary";
import { dbConnection } from "./database/dbConnection.js";

const requiredEnvVars = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET_KEY",
  "JWT_EXPIRES",
  "COOKIE_EXPIRE",
];

const getMissingEnvVars = () => {
  return requiredEnvVars.filter((key) => !process.env[key]);
};

const startServer = async () => {
  const missingEnvVars = getMissingEnvVars();
  if (missingEnvVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
    process.exit(1);
  }

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

  await dbConnection();

  app.listen(process.env.PORT, () => {
    console.log(`Server listening at port ${process.env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
