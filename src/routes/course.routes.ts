import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { UserRolesEnum } from "../constants";
import { validate } from "../middlewares/validate.middleware";
import { createCourse, createMaterialByCourseId, getAllCourses } from "../controllers/course.controller";
import { createCourseValidator, createMaterialValidator } from "../validators";

const router = Router();

// Create course & Get all courses
router
    .route("/")
    .post(jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validate(createCourseValidator),
        createCourse)
    .get(jwtVerify,getAllCourses);  // Public Accessible


// Create material by course id
router
    .route("/:id/materials")
    .post(jwtVerify, checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]), validate(createMaterialValidator), createMaterialByCourseId);

export default router;