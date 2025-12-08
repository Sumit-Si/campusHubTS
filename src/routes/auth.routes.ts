import { Router } from "express";
import { login, register, logout } from "../controllers/auth.controller";
import { registerValidator } from "../validators";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

// register
router
    .route("/register")
    .post(validate(registerValidator),register);

// login
router
    .route("/login")
    .post(login);

// logout
router
    .route("/logout")
    .post(logout);

export default router;