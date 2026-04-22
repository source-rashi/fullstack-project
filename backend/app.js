import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { errorMiddleware } from "./middlewares/error.js";
import messageRouter from "./router/messageRouter.js";
import userRouter from "./router/userRouter.js";
import appointmentRouter from "./router/appointmentRouter.js";
import { apiLimiter, authLimiter } from "./middlewares/rateLimiter.js";

const app = express();
config({ path: "./config.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const allowedOrigins = [
  process.env.FRONTEND_URL_ONE,
  process.env.FRONTEND_URL_TWO,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", apiLimiter);
app.use("/api/v1/user/login", authLimiter);

app.use("/api/v1/message", messageRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/appointment", appointmentRouter);

app.use(errorMiddleware);
export default app;
