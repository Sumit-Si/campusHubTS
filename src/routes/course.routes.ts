import { Router } from "express";
import { checkRole, jwtVerify } from "../middlewares/auth.middleware";
import { UserRolesEnum } from "../constants";
import { validate, validateParams } from "../middlewares/validate.middleware";
import { createCourse, createMaterialByCourseId, getAllCourses, getMaterialsByCourseId } from "../controllers/course.controller";
import { courseIdParamValidator, createCourseValidator, createMaterialValidator } from "../validators";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

// Create course & Get all courses
router
    .route("/")
    .post(jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        validate(createCourseValidator),
        createCourse)
    .get(getAllCourses);  // Public Accessible


// Create material by course id
router
    .route("/:id/materials")
    .post(jwtVerify,
        checkRole([UserRolesEnum.ADMIN, UserRolesEnum.FACULTY]),
        upload.array("files", 3),
        validateParams(courseIdParamValidator),
        validate(createMaterialValidator),
        createMaterialByCourseId)
    .get(jwtVerify,
        checkRole([UserRolesEnum.STUDENT, UserRolesEnum.FACULTY]), 
        validateParams(courseIdParamValidator),
        getMaterialsByCourseId);

export default router;