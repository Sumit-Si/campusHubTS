import { Router } from "express";
import { jwtVerify } from "../middlewares/auth.middleware";
import { getAllNotifications } from "../controllers/notification.controller";

const router = Router();

// Create & Get all notifications
router
    .route("/")
    .get(jwtVerify, getMyNotifications);

export default router;