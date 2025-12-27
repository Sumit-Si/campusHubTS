import rateLimit, { Store } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisConnection } from "./redisConnection";


const baseOptions = {
  // store: 
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  ipv6Subnet: 56,
};

// ----- Global Limiter -----
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: "Too many requests from this IP. Please try again later.",
  ...baseOptions,
});

// ----- Auth Limiter -----
const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many requests from this IP. Please try again later.",
});

// ----- Password Reset Limiter -----
const passwordLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many password reset attempts. Please try again later.",
});

export { authLimiter, globalLimiter, passwordLimiter };