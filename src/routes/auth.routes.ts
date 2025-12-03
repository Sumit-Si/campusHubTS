import { Router } from "express";
import { register } from "../controllers/auth.controller";

const router = Router();

// register
router
    .route("/register")
    .post(register);

export default router;