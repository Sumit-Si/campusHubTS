import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { deleteNotificationById, getAllUnreadNotifications, getMyNotifications, updateBulkNotifications, updateNotificationById } from "../controllers/notification.controller";
import { AvailableUserRoles } from "../constants";
import { validate, validateParams } from "../middlewares/validate.middleware";
import { notificationIdParamValidator, updateBulkNotificationsValidator } from "../validators";

const router = Router();

// Create & Get all notifications
router
    .route("/")
    .get(jwtVerify, checkRole(AvailableUserRoles), getMyNotifications);


// Get all unread notifications
router
    .route("/unread")
    .get(jwtVerify, checkRole(AvailableUserRoles), getAllUnreadNotifications);


// Update read status by id -- Single
router
    .route("/:id/read")
    .patch(jwtVerify,
        checkRole(AvailableUserRoles),
        validateParams(notificationIdParamValidator),
        updateNotificationById);


// Update read status by id -- Bulk
router
    .route("/mark-read")
    .patch(jwtVerify,
        checkRole(AvailableUserRoles),
        validate(updateBulkNotificationsValidator),
        updateBulkNotifications);

// Delete a notification by id
router
    .route("/:id/delete")
    .delete(jwtVerify,
        checkRole(AvailableUserRoles),
        validateParams(notificationIdParamValidator),
        deleteNotificationById,
    )

export default router;