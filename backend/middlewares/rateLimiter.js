import rateLimit from "express-rate-limit";

const defaultRateLimitResponse = {
  success: false,
  message: "Too many requests from this IP, please try again later.",
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: defaultRateLimitResponse,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please wait before retrying.",
  },
});

export const messageSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.MESSAGE_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Message rate limit exceeded. Please try again later.",
  },
});
