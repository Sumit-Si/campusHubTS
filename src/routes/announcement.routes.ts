import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { createAnnouncement, getAllAnnouncements } from "../controllers/announcement.controller";
import { AvailableUserRoles, UserRolesEnum } from "../constants";
import { upload } from "../middlewares/multer.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createAnnouncementValidator } from "../validators";


const router = Router();

// Create & Get all announcements
router
    .route("/")
    .post(jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        upload.array("attachments", 3),
        validate(createAnnouncementValidator),
        createAnnouncement,
    )
    .get(jwtVerify,
        checkRole(AvailableUserRoles),
        getAllAnnouncements,
    )

export default router;