import express from "express";
import {
  getAllMessages,
  sendMessage,
} from "../controller/messageController.js";
import { isAdminAuthenticated } from "../middlewares/auth.js";
import { messageSendLimiter } from "../middlewares/rateLimiter.js";
const router = express.Router();

router.post("/send", messageSendLimiter, sendMessage);
router.get("/getall", isAdminAuthenticated, getAllMessages);

export default router;
