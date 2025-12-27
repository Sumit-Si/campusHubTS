import { Router } from "express";
import { login, register, logout, profile, generateApiKey, refreshAccessToken, currentUser } from "../controllers/auth.controller";
import { apiKeyValidator, loginValidator, registerValidator } from "../validators";
import { validate } from "../middlewares/validate.middleware";
import { jwtVerify } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";
import { authLimiter } from "../config/rateLimiters";

const router = Router();

// register
router
    .route("/register")
    .post(authLimiter, upload.single("avatar"), validate(registerValidator), register);

// login
router
    .route("/login")
    .post(authLimiter, validate(loginValidator), login);

// logout
router
    .route("/logout")
    .post(jwtVerify, logout);

// profile
router
    .route("/me")
    .get(jwtVerify, profile);

// apiKey
router
    .route("/api-key")
    .post(jwtVerify, validate(apiKeyValidator), generateApiKey);

// refresh Access token
router
    .route("/refresh-access-token")
    .get(jwtVerify, refreshAccessToken);

// current user
router
    .route("/current-user")
    .get(jwtVerify, currentUser);


export default router;