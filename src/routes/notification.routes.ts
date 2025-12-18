import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { getMyNotifications } from "../controllers/notification.controller";
import { AvailableUserRoles } from "../constants";

const router = Router();

// Create & Get all notifications
router
    .route("/")
    .get(jwtVerify, checkRole(AvailableUserRoles), getMyNotifications);

export default router;