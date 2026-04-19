import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Message } from "../models/messageSchema.js";

export const sendMessage = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, message } = req.body;
  if (!firstName || !lastName || !email || !phone || !message) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const normalizedMessage = {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone).trim(),
    message: String(message).trim(),
  };

  if (
    !normalizedMessage.firstName ||
    !normalizedMessage.lastName ||
    !normalizedMessage.email ||
    !normalizedMessage.phone ||
    !normalizedMessage.message
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  if (normalizedMessage.message.length < 10 || normalizedMessage.message.length > 1000) {
    return next(new ErrorHandler("Message should be between 10 and 1000 characters!", 400));
  }

  const hasLinks = /(https?:\/\/|www\.)/i.test(normalizedMessage.message);
  if (hasLinks) {
    return next(new ErrorHandler("Links are not allowed in message body!", 400));
  }

  await Message.create(normalizedMessage);
  res.status(200).json({
    success: true,
    message: "Message Sent!",
  });
});

export const getAllMessages = catchAsyncErrors(async (req, res, next) => {
  const messages = await Message.find();
  res.status(200).json({
    success: true,
    messages,
  });
});
